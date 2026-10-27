
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

   Responsabilidades:
   - Validar a identidade do usuário.
   - Consultar as permissões editoriais.
   - Medir o tempo de cada operação.
   - Liberar o painel após autorização.
========================================================== */

async function verificarAcessoEditorial() {
    const inicio = performance.now();

    try {
        /* 3.1 — Validar identidade */
        const inicioUsuario = performance.now();

        const { data, error } = await supabase.auth.getUser();

        console.log(
            "[OZZY] Validação do usuário:",
            Math.round(performance.now() - inicioUsuario),
            "ms"
        );

        if (error || !data.user) {
            await bloquearAcesso();
            return;
        }

        /* 3.2 — Consultar permissões */
        const inicioPerfil = performance.now();

        const { data: perfil, error: erroPerfil } = await supabase
            .from("perfis")
            .select("cargo")
            .eq("id", data.user.id)
            .single();

        console.log(
            "[OZZY] Consulta do perfil:",
            Math.round(performance.now() - inicioPerfil),
            "ms"
        );

        if (
            erroPerfil ||
            !perfil ||
            !["editor", "administrador"].includes(perfil.cargo)
        ) {
            await bloquearAcesso();
            return;
        }

        /* 3.3 — Liberar painel */
        document.documentElement.style.visibility = "visible";

        console.log(
            "[OZZY] Tempo total da proteção:",
            Math.round(performance.now() - inicio),
            "ms"
        );

    } catch (erro) {
        console.error("[OZZY] Erro de acesso:", erro);
        await bloquearAcesso();
    }
}



/* ==========================================================
   4. INICIALIZAÇÃO DA PROTEÇÃO

   Inicia a verificação assim que o módulo é carregado.
========================================================== */

verificarAcessoEditorial();
