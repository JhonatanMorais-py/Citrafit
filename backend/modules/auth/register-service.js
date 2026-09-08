import { supabaseAdmin } from "../../config/supabase.js";

const normalizeEmail = (email) => email.trim().toLowerCase();

export async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    if (/already|registered|exists/i.test(authError.message)) {
      return { error: "EMAIL_ALREADY_REGISTERED" };
    }
    throw authError;
  }

  const userId = data.user.id;
  const { error: profileError } = await supabaseAdmin
    .from("cad_perfis")
    .insert({ id: userId, nome: name });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw profileError;
  }

  return {
    user: {
      id: userId,
      email: normalizedEmail,
      name,
    },
  };
}
