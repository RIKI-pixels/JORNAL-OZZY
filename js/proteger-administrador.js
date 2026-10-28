
/* ==========================================================
   JORNAL OZZY — PROTEÇÃO DO ADMINISTRADOR

   Responsabilidades:
   - Verificar a sessão do usuário.
   - Consultar o cargo no Supabase.
   - Permitir acesso somente ao administrador.
   - Redirecionar usuários sem permissão.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY = "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* ==========================================================
   REDIRECIONAR ACESSO NÃO AUTORIZADO

   Executada quando o usuário não é administrador.

   Responsabilidade:
   - Impedir a visualização da página.
   - Redirecionar para o painel editorial.

   Não encerra a sessão de um editor válido.
========================================================== */

function bloquearAcessoAdministrador() {
    window.location.replace("index.html");
}


/* ==========================================================
   VERIFICAR PERMISSÃO ADMINISTRATIVA

   Executada ao abrir uma página administrativa.

   Responsabilidades:
   - Validar a identidade no Supabase Auth.
   - Consultar o cargo do usuário.
   - Liberar a página somente para administradores.
========================================================== */

async function verificarAdministrador() {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
            window.location.replace("../index.html");
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
            perfil.cargo !== "administrador"
        ) {
            bloquearAcessoAdministrador();
            return;
        }

        document.documentElement.style.visibility = "visible";

    } catch (erro) {
        console.error("[OZZY] Erro na proteção administrativa:", erro);
        bloquearAcessoAdministrador();
    }
}


/* ==========================================================
   INICIALIZAÇÃO

   Executa a verificação ao carregar o módulo.
========================================================== */

verificarAdministrador();
