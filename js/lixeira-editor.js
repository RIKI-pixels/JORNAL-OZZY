
/* ==========================================================
   JORNAL OZZY — LIXEIRA EDITORIAL

   Responsabilidades:
   - Consultar notícias excluídas no Supabase.
   - Exibir os registros na lixeira.
   - Preparar a restauração de publicações.

   A restauração será implementada posteriormente.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY = "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);



/* ==========================================================
   RESTAURAR NOTÍCIA EXCLUÍDA

   Executada quando o administrador clica em RESTAURAR.

   Responsabilidades:
   - Solicitar confirmação da restauração.
   - Validar a sessão e o cargo do usuário.
   - Remover as informações de exclusão lógica.
   - Atualizar a listagem da lixeira.

   A autorização definitiva também depende das
   políticas RLS configuradas no Supabase.
========================================================== */

async function restaurarNoticia(id) {
    const confirmado = window.confirm(
        "Deseja restaurar esta notícia?"
    );

    if (!confirmado) {
        return;
    }

    try {
        const { data: usuario, error: erroUsuario } =
            await supabase.auth.getUser();

        if (erroUsuario || !usuario.user) {
            throw new Error("Sessão inválida.");
        }

        const { data: perfil, error: erroPerfil } =
            await supabase
                .from("perfis")
                .select("cargo")
                .eq("id", usuario.user.id)
                .single();

        if (
            erroPerfil ||
            perfil?.cargo !== "administrador"
        ) {
            throw new Error(
                "Apenas administradores podem restaurar notícias."
            );
        }

        const { data, error } = await supabase
            .from("noticias")
            .update({
                excluido_em: null,
                excluido_por: null,
                atualizado_por: usuario.user.id
            })
            .eq("id", id)
            .not("excluido_em", "is", null)
            .select("id");

        if (error) {
            throw error;
        }

        if (!data || data.length !== 1) {
            throw new Error(
                "A notícia não foi restaurada. Verifique as permissões."
            );
        }

        window.alert("Notícia restaurada com sucesso!");

        await carregarLixeira();

    } catch (erro) {
        console.error(
            "[OZZY] Erro ao restaurar notícia:",
            erro
        );

        window.alert(
            "Não foi possível restaurar a notícia: " +
            erro.message
        );
    }
}


/* ==========================================================
   CRIAR CARTÃO DE NOTÍCIA EXCLUÍDA

   Executada para cada notícia retornada pelo Supabase.

   Responsabilidades:
   - Exibir informações da publicação.
   - Identificar o registro excluído.
   - Preparar o botão RESTAURAR.
========================================================== */

function criarCartaoLixeira(noticia) {
    const artigo = document.createElement("article");
    artigo.className = "dev-publicacao-item";

    const id = document.createElement("span");
    id.className = "dev-id";
    id.textContent = String(noticia.id).slice(0, 8);

    const informacoes = document.createElement("div");

    const titulo = document.createElement("strong");
    titulo.textContent = noticia.titulo || "SEM TÍTULO";

    const autor = document.createElement("small");
    autor.textContent = noticia.autor || "REDAÇÃO JORNAL OZZY";

    informacoes.append(titulo, autor);

    const categoria = document.createElement("span");
    categoria.className = "dev-tag";
    categoria.textContent = noticia.categoria || "GERAL";

    const data = document.createElement("span");
    data.textContent = noticia.excluido_em
        ? new Date(noticia.excluido_em).toLocaleDateString("pt-BR")
        : "SEM DATA";

    const acoes = document.createElement("div");
    acoes.className = "dev-item-acoes";

    const restaurar = document.createElement("button");
    restaurar.type = "button";
    restaurar.className = "botao-retro";
    restaurar.textContent = "RESTAURAR";
    restaurar.disabled = true;
    restaurar.title = "Restauração disponível em breve";

    acoes.appendChild(restaurar);

    artigo.append(id, informacoes, categoria, data, acoes);

    return artigo;
}


/* ==========================================================
   CARREGAR NOTÍCIAS EXCLUÍDAS

   Executada ao abrir a lixeira.

   Responsabilidades:
   - Buscar registros com excluido_em preenchido.
   - Ordenar pelas exclusões mais recentes.
   - Atualizar a contagem de registros.
   - Exibir os cartões encontrados.
========================================================== */

async function carregarLixeira() {
    const lista = document.getElementById("lixeira-noticias-lista");
    const contador = document.getElementById("lixeira-total");

    if (!lista || !contador) {
        return;
    }

    lista.textContent = "CARREGANDO LIXEIRA...";

    try {
        const { data: noticias, error } = await supabase
            .from("noticias")
            .select("id, titulo, autor, categoria, excluido_em")
            .not("excluido_em", "is", null)
            .order("excluido_em", { ascending: false });

        if (error) {
            throw error;
        }

        lista.replaceChildren();

        contador.textContent =
            `${String(noticias.length).padStart(3, "0")} REGISTROS`;

        if (noticias.length === 0) {
            lista.textContent = "NENHUMA NOTÍCIA EXCLUÍDA.";
            return;
        }

        const fragmento = document.createDocumentFragment();

        noticias.forEach((noticia) => {
            fragmento.appendChild(criarCartaoLixeira(noticia));
        });

        lista.appendChild(fragmento);

    } catch (erro) {
        console.error("[OZZY] Erro ao carregar lixeira:", erro);
        lista.textContent = "ERRO AO CARREGAR LIXEIRA.";
    }
}


/* ==========================================================
   INICIALIZAÇÃO

   Executa a consulta ao carregar a página.
========================================================== */

carregarLixeira();

