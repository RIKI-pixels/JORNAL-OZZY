
/* ==========================================================
   JORNAL OZZY — PROTEÇÃO DO SISTEMA EDITORIAL

   Responsabilidades:
   - Verificar a sessão do usuário.
   - Confirmar que possui perfil editorial.
   - Bloquear a visualização do painel sem autorização.
   - Redirecionar usuários não autorizados.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* ==========================================================
   1. CONFIGURAÇÃO DO SUPABASE
========================================================== */

const SUPABASE_URL = "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY = "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* ==========================================================
   2. REDIRECIONAMENTO DE ACESSO

   Executada quando o usuário não possui autorização.

   Responsabilidade:
   - Encerrar a sessão local, quando necessário.
   - Enviar o visitante para a página inicial.
========================================================== */

async function bloquearAcesso() {
    await supabase.auth.signOut({ scope: "local" });

    window.location.replace("../index.html");
}


/* ==========================================================
   3. VERIFICAÇÃO DO EDITOR

   Executada ao carregar uma página administrativa.

   Responsabilidades:
   - Validar a sessão com o servidor Supabase.
   - Consultar o perfil do usuário autenticado.
   - Confirmar o cargo de editor ou administrador.
   - Liberar a interface somente após a verificação.
========================================================== */

async function verificarAcessoEditorial() {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
            await bloquearAcesso();
            return;
        }

        const { data: perfil, error: erroPerfil } = await supabase
            .from("perfis")
            .select("cargo")
            .eq("id", data.user.id)
            .single();

        if (
            erroPerfil ||
            !perfil ||
            !["editor", "administrador"].includes(perfil.cargo)
        ) {
            await bloquearAcesso();
            return;
        }

        // Libera o painel somente após validar a autorização.
        document.documentElement.style.visibility = "visible";

    } catch (erro) {
        console.error("Erro ao verificar acesso editorial:", erro);

        await bloquearAcesso();
    }
}


/* ==========================================================
   4. INICIALIZAÇÃO DA PROTEÇÃO

   Inicia a verificação assim que o módulo é carregado.
========================================================== */

verificarAcessoEditorial();
