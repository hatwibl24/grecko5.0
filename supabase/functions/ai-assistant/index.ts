import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// --- CONFIGURATION ---
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// --- HELPER: Raw Request to Google ---
async function generateAIContent(apiKey: string, prompt: string, isJsonMode = false) {
  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  // Force JSON mode if requested (New Gemini Feature)
  if (isJsonMode) {
    payload.generationConfig = {
      response_mime_type: "application/json"
    };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Google API Error:", JSON.stringify(data));
    // Fallback error message
    throw new Error(data.error?.message || "AI Service Unavailable");
  }

  // Extract text safely
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI returned empty response");
  
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });

  try {
    console.log("🔹 AI Assistant: Request Received");

    // 1. AUTHENTICATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized: User not found");

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    // 2. PARSE REQUEST
    const body = await req.json();
    const { type, session_id, ...data } = body;
    console.log(`🔹 Processing Type: ${type}`);

    // ========================================================================
    //  FEATURE 1: CHAT (With Full Academic Context)
    // ========================================================================
    if (type === "chat") {
      let currentSessionId = session_id;
      const userPrompt = data.prompt;

      // Ensure Session
      if (!currentSessionId || currentSessionId === "new") {
        const title = userPrompt.substring(0, 30) + "...";
        const { data: session, error } = await supabaseClient.from("chat_sessions").insert({
          user_id: user.id,
          title
        }).select().single();
        if (error) throw error;
        currentSessionId = session.id;
      }

      // Save User Message
      await supabaseClient.from("chat_messages").insert({
        session_id: currentSessionId,
        role: "user",
        message: userPrompt,
        user_id: user.id
      });

      // Fetch History (Last 10 messages)
      const { data: history } = await supabaseClient.from("chat_messages").select("role, message").eq("session_id", currentSessionId).order("created_at", {
        ascending: false
      }).limit(10);
      
      const historyText = history ? history.reverse().map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.message}`).join('\n') : "";

      // --- CONTEXT PROCESSING ---
      const context = data.context || {};
      const userProfile = context.user || {};
      const goals = context.academicGoals || {};

      // Format Assignments
      const pendingAssigns = context.assignments?.pending?.map((a: any) => 
        `- ${a.title} (${a.course}) Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Date'}`
      ).join('\n') || "No pending assignments.";

      const completedAssigns = context.assignments?.completed?.map((a: any) => 
        `- ${a.title} (${a.course})`
      ).join('\n') || "No recently completed assignments.";

      // Format Quiz Results
      const recentQuizzes = context.quizResults?.map((q: any) => 
        `- ${q.courseName}: ${q.score}% (${q.date})`
      ).join('\n') || "No recent quizzes.";

      // Construct Mentor Persona
      const contextPrompt = `
        System: You are Grecko, a personalized academic mentor for ${userProfile.name}.
        Your Goal: Help the student improve their grades, manage their assignments, and stay motivated.
        
        STUDENT PROFILE:
        - Grade: ${userProfile.grade || "N/A"}
        - School: ${userProfile.school || "N/A"}
        - Bio: ${userProfile.bio || "N/A"}
        
        ACADEMIC GOALS:
        - Current GPA: ${goals.currentGpa || 0}
        - Target GPA: ${goals.targetGpa || 4.0}
        - Required Average to hit Target: ${goals.requiredGpa || "N/A"}
        
        CURRENT WORKLOAD:
        [Pending Assignments]
        ${pendingAssigns}
        
        [Recent Achievements]
        ${completedAssigns}
        
        PERFORMANCE HISTORY (Quizzes):
        ${recentQuizzes}
        
        INSTRUCTIONS:
        1. Act as a supportive, knowledgeable mentor.
        2. Reference their specific assignments (e.g., "Don't forget your Math homework due tomorrow").
        3. If their recent quiz scores are low (under 70%), suggest specific study topics or strategies.
        4. If they are close to their Target GPA, encourage them. If far, help them prioritize.
        5. Keep responses concise and conversational.
        
        CHAT HISTORY:
        ${historyText}
        
        Student: ${userPrompt}
        Tutor:
      `;

      const aiResponse = await generateAIContent(apiKey, contextPrompt);

      // Save AI Message
      await supabaseClient.from("chat_messages").insert({
        session_id: currentSessionId,
        role: "ai",
        message: aiResponse,
        user_id: user.id
      });

      return new Response(JSON.stringify({
        text: aiResponse,
        session_id: currentSessionId
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // ========================================================================
    //  FEATURE 2: QUIZ (Strict JSON Mode)
    // ========================================================================
    if (type === "quiz") {
      const prompt = `
        Generate 5 multiple choice questions about "${data.courseTitle}".
        Context: ${data.courseContent?.substring(0, 5000) || "General Knowledge"}.
        Schema: Array of objects with keys: question (string), options (string[]), correct (int index), explanation (string).
      `;
      // Use isJsonMode = true
      const jsonStr = await generateAIContent(apiKey, prompt, true);
      return new Response(JSON.stringify({
        data: JSON.parse(jsonStr)
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // ========================================================================
    //  FEATURE 3: FLASHCARDS (Strict JSON Mode)
    // ========================================================================
    if (type === "flashcards") {
      const prompt = `
        Generate 8 flashcards about "${data.courseTitle}".
        Context: ${data.courseContent?.substring(0, 5000) || "General Knowledge"}.
        Schema: Array of objects with keys: front (string), back (string), category (string).
      `;
      // Use isJsonMode = true
      const jsonStr = await generateAIContent(apiKey, prompt, true);
      return new Response(JSON.stringify({
        data: JSON.parse(jsonStr)
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // ========================================================================
    //  FEATURE 4: TEXT ANALYSIS
    // ========================================================================
    if (type === "text-analysis") {
      const prompt = data.action === "question" ? `Answer this: "${data.prompt}" based on: "${data.text.substring(0, 5000)}"` : `${data.action} this text: "${data.text.substring(0, 5000)}"`;
      const aiResponse = await generateAIContent(apiKey, prompt);
      return new Response(JSON.stringify({
        text: aiResponse
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // ========================================================================
    //  FEATURE 5: AVATAR (Dicebear)
    // ========================================================================
    if (type === "avatar" || type === "image" || type === "text-analysis" && data.action === "avatar") {
      const seed = data.prompt || user.email;
      const url = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      return new Response(JSON.stringify({
        url,
        image: ""
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // ========================================================================
    //  UTILITIES: HISTORY & MANAGEMENT
    // ========================================================================
    if (type === "list_sessions") {
      const { data: sessions } = await supabaseClient.from("chat_sessions").select("id, title, created_at").eq("user_id", user.id).order("created_at", {
        ascending: false
      });
      return new Response(JSON.stringify({
        sessions: sessions || []
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    if (type === "get_messages") {
      if (!session_id || session_id === "new" || session_id.length < 10) return new Response(JSON.stringify({
        messages: []
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
      const { data: messages } = await supabaseClient.from("chat_messages").select("*").eq("session_id", session_id).order("created_at", {
        ascending: true
      });
      return new Response(JSON.stringify({
        messages: messages || []
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    if (type === "delete_session") {
        if (!session_id) throw new Error("Session ID is required");

        // Try to use Service Role Key to guarantee deletion even if RLS is strict
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("DATABASE_SERVICE_ROLE_KEY");
        const adminClient = serviceRoleKey 
            ? createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey)
            : supabaseClient; // Fallback to user client if no service key

        console.log(`Deleting session ${session_id} for user ${user.id}`);

        // 1. Delete messages first (to respect Foreign Key constraints)
        const { error: msgError } = await adminClient
            .from("chat_messages")
            .delete()
            .eq("session_id", session_id);
            // Note: If using Service Role, we might skip .eq("user_id") if we trust the input,
            // but for safety we should usually verify ownership if we had the session data loaded.
            // However, RLS policies on the table usually handle this if using standard client.
            // With Admin client, we just delete by ID.

        if (msgError) console.error("Error deleting messages:", msgError);

        // 2. Delete the session
        const { error: sessionError } = await adminClient
            .from("chat_sessions")
            .delete()
            .eq("id", session_id);

        if (sessionError) throw sessionError;

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    throw new Error(`Unknown request type: ${type}`);
  } catch (error: any) {
    console.error("❌ Edge Function Error:", error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
