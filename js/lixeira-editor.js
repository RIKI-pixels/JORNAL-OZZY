
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

