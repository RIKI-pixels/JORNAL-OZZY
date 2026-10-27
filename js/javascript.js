
/* ==========================================================
   JORNAL OZZY — SISTEMA DE AUTENTICAÇÃO EDITORIAL

   Responsabilidades:
   - Controlar as telas de acesso do portal.
   - Autenticar editores utilizando o Supabase.
   - Armazenar a sessão autenticada.
   - Redirecionar editores ao painel editorial.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* ==========================================================
   1. CONFIGURAÇÃO DO SUPABASE

   Define o endereço e a chave pública do projeto.
   A chave service_role nunca deve ser utilizada aqui.
========================================================== */

const SUPABASE_URL = "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY = "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* ==========================================================
   2. ELEMENTOS DA INTERFACE

   Identifica os componentes HTML utilizados para
   controlar as janelas e o formulário de autenticação.
========================================================== */

const acesso = document.getElementById("acesso-inicial");
const login = document.getElementById("login-editorial");
const formulario = document.getElementById("form-login-editor");
const status = document.getElementById("login-status");
const autenticar = document.getElementById("login-autenticar");


/* ==========================================================
   3. ACESSO COMO LEITOR

   Executada quando o visitante seleciona LEITOR.

   Responsabilidade:
   - Fechar a janela inicial.
   - Permitir a navegação pública pelo jornal.
========================================================== */

function acessarComoLeitor() {
    acesso.style.display = "none";
}


/* ==========================================================
   4. ABERTURA DO LOGIN EDITORIAL

   Executada quando o visitante seleciona EDITOR.

   Responsabilidade:
   - Fechar a janela de seleção de acesso.
   - Exibir o formulário de autenticação editorial.
========================================================== */

function abrirLoginEditorial() {
    acesso.style.display = "none";
    login.style.display = "flex";
}


/* ==========================================================
   5. CANCELAMENTO DO LOGIN

   Executada quando o usuário clica em CANCELAR.

   Responsabilidade:
   - Fechar a janela de autenticação.
   - Retornar à seleção inicial.
   - Limpar os campos do formulário.
========================================================== */

function cancelarLoginEditorial() {
    login.style.display = "none";
    acesso.style.display = "flex";

    formulario.reset();
}


/* ==========================================================
   6. ATUALIZAÇÃO DO STATUS DE AUTENTICAÇÃO

   Recebe uma mensagem e a apresenta na interface.

   Parâmetro:
   - mensagem: texto que será exibido ao usuário.

   Responsabilidade:
   - Informar o andamento ou resultado do login.
========================================================== */

function atualizarStatusLogin(mensagem) {
    status.textContent = mensagem;
}


/* ==========================================================
   7. AUTENTICAÇÃO EDITORIAL

   Executada quando o formulário é enviado.

   Responsabilidades:
   - Impedir o envio tradicional do formulário.
   - Coletar usuário e senha.
   - Consultar a Edge Function login-editor.
   - Validar a resposta do servidor.
   - Registrar a sessão no cliente Supabase.
   - Redirecionar ao painel após autenticação.
   - Informar possíveis erros ao usuário.
========================================================== */

async function autenticarEditor(evento) {
    evento.preventDefault();

    const usuario = document
        .getElementById("editor-usuario")
        .value.trim();

    const senha = document
        .getElementById("editor-senha")
        .value;

    autenticar.disabled = true;

    atualizarStatusLogin("AUTENTICANDO...");

    try {

        const resposta = await fetch(
            `${SUPABASE_URL}/functions/v1/login-editor`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY
                },

                body: JSON.stringify({
                    usuario,
                    senha
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            atualizarStatusLogin(
                dados.erro || "FALHA NA AUTENTICAÇÃO"
            );
            return;
        }

        if (!dados.access_token || !dados.refresh_token) {
            throw new Error("Sessão inválida");
        }

        const { error } = await supabase.auth.setSession({
            access_token: dados.access_token,
            refresh_token: dados.refresh_token
        });

        if (error) {
            throw error;
        }

        window.location.href = "dev/index.html";

    } catch (erro) {

        console.error("Erro na autenticação:", erro);

        atualizarStatusLogin(
            "ERRO DE CONEXÃO OU AUTENTICAÇÃO"
        );

    } finally {

        autenticar.disabled = false;

    }
}


/* ==========================================================
   8. REGISTRO DOS EVENTOS

   Associa os elementos HTML às funções correspondentes.

   Responsabilidade:
   - Executar a função correta quando o usuário
     interagir com os botões ou enviar o formulário.
========================================================== */

document
    .getElementById("acesso-leitor")
    ?.addEventListener("click", acessarComoLeitor);

document
    .getElementById("acesso-editor")
    ?.addEventListener("click", abrirLoginEditorial);

document
    .getElementById("login-cancelar")
    ?.addEventListener("click", cancelarLoginEditorial);

formulario?.addEventListener(
    "submit",
    autenticarEditor
);
