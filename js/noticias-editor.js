/* ==========================================================
   JORNAL OZZY — GERENCIAMENTO DE NOTÍCIAS

   Responsabilidades:
   - Coletar informações do formulário.
   - Validar os campos obrigatórios.
   - Salvar notícias no Supabase.
   - Informar o resultado da publicação.

   Upload de imagens será implementado separadamente.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* ==========================================================
   1. CONFIGURAÇÃO DO SUPABASE

   Estabelece a conexão com o banco de dados utilizando
   exclusivamente a chave pública do projeto.
========================================================== */

const SUPABASE_URL = "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY = "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const formulario = document.getElementById("form-noticia");
const botaoPublicar = document.getElementById("noticia-publicar");


/* ==========================================================
   2. LEITURA DOS CAMPOS

   Executada quando o editor solicita uma publicação.

   Responsabilidade:
   - Reunir as informações do formulário.
   - Converter os campos para a estrutura do banco.
========================================================== */

function coletarDadosNoticia() {
    const valor = (id) =>
        document.getElementById(id)?.value.trim() || "";

    return {
        titulo: valor("noticia-titulo"),
        subtitulo: valor("noticia-subtitulo") || null,
        categoria: valor("noticia-categoria"),
        autor: valor("noticia-autor") || null,
        data_publicacao: valor("noticia-data"),
        hora_publicacao: valor("noticia-hora"),
        imagem_url: null,
        imagem_legenda: valor("noticia-legenda") || null,
        conteudo: valor("noticia-conteudo"),
        citacao: valor("noticia-citacao") || null,
        citacao_autor: valor("noticia-citacao-autor") || null,
        origem: valor("noticia-origem") || null,
        setor: valor("noticia-setor") || null,
        destaque: document.getElementById("noticia-destaque")?.checked || false
    };
}


/* ==========================================================
   3. VALIDAÇÃO DA NOTÍCIA

   Executada antes do envio ao Supabase.

   Responsabilidade:
   - Impedir publicações sem informações obrigatórias.

   Retorno:
   - true: notícia válida.
   - false: existem campos obrigatórios vazios.
========================================================== */

function validarNoticia(noticia) {
    if (
        !noticia.titulo ||
        !noticia.categoria ||
        !noticia.data_publicacao ||
        !noticia.hora_publicacao ||
        !noticia.conteudo
    ) {
        alert("Preencha os campos obrigatórios da notícia.");
        return false;
    }

    return true;
}

/* ==========================================================
   UPLOAD DE IMAGEM DA NOTÍCIA

   Executada durante a publicação, quando o editor
   seleciona uma imagem no formulário.

   Responsabilidades:
   - Verificar se uma imagem foi selecionada.
   - Validar o formato e o tamanho do arquivo.
   - Enviar a imagem ao Supabase Storage.
   - Retornar o endereço público da imagem.

   Se não houver imagem, retorna null.
========================================================== */

async function enviarImagemNoticia() {

    const campoImagem = document.getElementById("noticia-imagem");
    const arquivo = campoImagem?.files?.[0];

    if (!arquivo) {
        return null;
    }

    const formatosPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
        throw new Error("Utilize uma imagem JPG, PNG ou WEBP.");
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
        throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const extensoes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    const nomeArquivo = `${crypto.randomUUID()}.${extensoes[arquivo.type]}`;

    const { error } = await supabase.storage
        .from("imagens-noticias")
        .upload(nomeArquivo, arquivo, {
            contentType: arquivo.type,
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data } = supabase.storage
        .from("imagens-noticias")
        .getPublicUrl(nomeArquivo);

    return data.publicUrl;
}


/* ==========================================================
   PUBLICAR OU ATUALIZAR NOTÍCIA

   Executada quando o editor envia o formulário.

   Responsabilidades:
   - Validar os dados e a sessão editorial.
   - Criar uma notícia quando não houver edição ativa.
   - Atualizar a notícia selecionada quando estiver editando.
   - Preservar a imagem existente se nenhuma nova for enviada.
   - Atualizar a listagem após salvar.
========================================================== */

async function publicarNoticia(evento) {
    evento.preventDefault();

    const noticia = coletarDadosNoticia();
    const editando = noticiaEmEdicao !== null;

    if (!validarNoticia(noticia)) {
        return;
    }

    botaoPublicar.disabled = true;
    botaoPublicar.textContent = editando
        ? "SALVANDO ALTERAÇÕES..."
        : "PUBLICANDO...";

    try {
        const { data: usuario, error: erroUsuario } =
            await supabase.auth.getUser();

        if (erroUsuario || !usuario.user) {
            throw new Error("Sessão editorial inválida.");
        }

        /* ================================================
           UPLOAD DE IMAGEM

           Só envia um novo arquivo quando selecionado.
           Na edição, mantém a imagem anterior caso
           o editor não escolha outra.
        ================================================= */

        const campoImagem = document.getElementById("noticia-imagem");
        const possuiNovaImagem = campoImagem?.files?.length > 0;

        if (possuiNovaImagem) {
            botaoPublicar.textContent = "ENVIANDO IMAGEM...";
            noticia.imagem_url = await enviarImagemNoticia();
        } else if (editando) {
            delete noticia.imagem_url;
        }

        /* ================================================
           EDIÇÃO DE NOTÍCIA EXISTENTE
        ================================================= */

        if (editando) {
            const { data: atualizadas, error } = await supabase
                .from("noticias")
                .update(noticia)
                .eq("id", noticiaEmEdicao)
                .is("excluido_em", null)
                .select("id");

            if (error) {
                throw error;
            }

            if (!atualizadas?.length) {
                throw new Error("A notícia não foi atualizada.");
            }

            alert("Notícia atualizada com sucesso!");

        } else {

            /* ================================================
               PUBLICAÇÃO DE NOVA NOTÍCIA
            ================================================= */

            const { error } = await supabase
                .from("noticias")
                .insert({
                    ...noticia,
                    criado_por: usuario.user.id
                });

            if (error) {
                throw error;
            }

            alert("Notícia publicada com sucesso!");
        }

        /* ================================================
           RESTAURAR FORMULÁRIO APÓS SALVAR
        ================================================= */

        formulario.reset();
        noticiaEmEdicao = null;

        botaoPublicar.textContent = "PUBLICAR";

        await carregarNoticias();

    } catch (erro) {
        console.error("[OZZY] Erro ao salvar notícia:", erro);

        alert(
            "Não foi possível salvar a notícia: " +
            erro.message
        );

    } finally {
        botaoPublicar.disabled = false;

        botaoPublicar.textContent =
            noticiaEmEdicao !== null
                ? "SALVAR ALTERAÇÕES"
                : "PUBLICAR";
    }
}

/* ==========================================================
   ENVIO DA IMAGEM E REGISTRO DA NOTÍCIA
========================================================== */

botaoPublicar.textContent = "ENVIANDO IMAGEM...";

const imagemUrl = await enviarImagemNoticia();

botaoPublicar.textContent = "SALVANDO NOTÍCIA...";

const { error } = await supabase
    .from("noticias")
    .insert({
        ...noticia,
        imagem_url: imagemUrl,
        criado_por: usuario.user.id
    });

       
        if (error) {
            throw error;
        }

        alert("Notícia publicada com sucesso!");

        formulario.reset();

    } catch (erro) {
        console.error("Erro ao publicar notícia:", erro);

        alert(
            "Não foi possível publicar a notícia: " +
            erro.message
        );

/* ==========================================================
   5. INICIALIZAÇÃO DO FORMULÁRIO

   Registra a função de publicação no formulário HTML.

   Responsabilidade:
   - Executar publicarNoticia quando o editor
     clicar no botão PUBLICAR.
========================================================== */

formulario?.addEventListener("submit", publicarNoticia);


/* ==========================================================
   CONTROLE DA NOTÍCIA EM EDIÇÃO

   Armazena o ID da notícia selecionada.
   null significa que o formulário está no modo de criação.
========================================================== */

let noticiaEmEdicao = null;


/* ==========================================================
   INICIAR EDIÇÃO DE NOTÍCIA

   Executada ao clicar no botão EDITAR.

   Responsabilidades:
   - Buscar a notícia selecionada no Supabase.
   - Preencher os campos do formulário.
   - Identificar a notícia que será atualizada.
   - Alterar o texto do botão para SALVAR ALTERAÇÕES.

   Esta função não modifica o banco de dados.
========================================================== */

async function iniciarEdicaoNoticia(id) {
    try {
        const { data: noticia, error } = await supabase
            .from("noticias")
            .select("*")
            .eq("id", id)
            .is("excluido_em", null)
            .single();

        if (error) {
            throw error;
        }

        const campos = {
            "noticia-titulo": noticia.titulo,
            "noticia-subtitulo": noticia.subtitulo,
            "noticia-categoria": noticia.categoria,
            "noticia-autor": noticia.autor,
            "noticia-data": noticia.data_publicacao,
            "noticia-hora": noticia.hora_publicacao?.slice(0, 5),
            "noticia-legenda": noticia.imagem_legenda,
            "noticia-conteudo": noticia.conteudo,
            "noticia-citacao": noticia.citacao,
            "noticia-citacao-autor": noticia.citacao_autor,
            "noticia-origem": noticia.origem,
            "noticia-setor": noticia.setor
        };

        Object.entries(campos).forEach(([idCampo, valor]) => {
            const campo = document.getElementById(idCampo);

            if (campo) {
                campo.value = valor ?? "";
            }
        });

        document.getElementById("noticia-destaque").checked =
            noticia.destaque === true;

        // O navegador não permite preencher arquivos automaticamente.
        // A imagem existente será preservada até uma nova seleção.

        document.getElementById("noticia-imagem").value = "";

        noticiaEmEdicao = noticia.id;

        botaoPublicar.textContent = "SALVAR ALTERAÇÕES";

        formulario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (erro) {
        console.error("[OZZY] Erro ao carregar notícia:", erro);

        alert("Não foi possível carregar a notícia para edição.");
    }
}

/* ==========================================================
   6. CRIAÇÃO DOS CARTÕES DE NOTÍCIAS

   Executada para cada notícia retornada pelo Supabase.

   Responsabilidades:
   - Criar os elementos visuais da publicação.
   - Exibir título, autor, categoria e data.
   - Preparar os botões de edição e exclusão.

   Os botões serão ativados em etapas posteriores.
========================================================== */

function criarCartaoNoticia(noticia) {
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

    if (noticia.data_publicacao) {
        const [ano, mes, dia] = noticia.data_publicacao.split("-");
        data.textContent = `${dia}/${mes}/${ano}`;
    } else {
        data.textContent = "SEM DATA";
    }

    const acoes = document.createElement("div");
    acoes.className = "dev-item-acoes";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "botao-retro";
    editar.textContent = "EDITAR";
    editar.addEventListener("click", () => {
    iniciarEdicaoNoticia(noticia.id);
});

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao-retro";
    excluir.textContent = "EXCLUIR";
    excluir.disabled = true;
    excluir.title = "Exclusão disponível em breve";

    acoes.append(editar, excluir);

    artigo.append(id, informacoes, categoria, data, acoes);

    return artigo;
}


/* ==========================================================
   7. CARREGAMENTO DAS NOTÍCIAS

   Executada ao abrir a página editorial.

   Responsabilidades:
   - Consultar as notícias não excluídas.
   - Ordenar as publicações mais recentes primeiro.
   - Atualizar a contagem de registros.
   - Exibir os cartões na listagem.
========================================================== */

async function carregarNoticias() {
    const lista = document.getElementById("noticias-lista");
    const contador = document.getElementById("noticias-total");

    if (!lista || !contador) {
        return;
    }

    lista.textContent = "CARREGANDO PUBLICAÇÕES...";

    try {
        const { data: noticias, error } = await supabase
            .from("noticias")
            .select("id, titulo, autor, categoria, data_publicacao")
            .is("excluido_em", null)
            .order("criado_em", { ascending: false });

        if (error) {
            throw error;
        }

        lista.replaceChildren();

        contador.textContent =
            `${String(noticias.length).padStart(3, "0")} REGISTROS`;

        if (noticias.length === 0) {
            lista.textContent = "NENHUMA PUBLICAÇÃO ENCONTRADA.";
            return;
        }

        const fragmento = document.createDocumentFragment();

        noticias.forEach((noticia) => {
            fragmento.appendChild(criarCartaoNoticia(noticia));
        });

        lista.appendChild(fragmento);

    } catch (erro) {
        console.error("[OZZY] Erro ao carregar notícias:", erro);
        lista.textContent = "ERRO AO CARREGAR PUBLICAÇÕES.";
    }
}


/* ==========================================================
   8. INICIALIZAÇÃO DA LISTAGEM

   Executada ao carregar o módulo JavaScript.

   Responsabilidade:
   - Buscar automaticamente as notícias cadastradas.
========================================================== */

carregarNoticias();


