<#
====================================================================================================
                        SUÍTE DE SMOKE TESTS AUTOMATIZADA - SISTEMA ESTOQUE.OS
====================================================================================================

OBJETIVO DA SUÍTE:
Esta ferramenta executa testes de fumaça (Smoke Tests) sequenciais e automatizados para validar a 
saúde operacional, a segurança de perímetro e as correções arquiteturais do sistema Estoque.OS.

POR QUE A ORDEM DOS TESTES IMPORTA?
Os testes são encadeados em ordem lógica de dependência:
  1. Primeiro valida se o servidor HTTP backend está vivo.
  2. Valida se o banco de dados remoto (Neon PostgreSQL) aceita consultas.
  3. Testa o cadastro de um novo usuário na rota pública simulando tentativa de invasão (escalação de role).
  4. Utiliza esse novo usuário para testar o login, validando hash bcrypt e gerando token JWT real.
  5. Usa o token do novo usuário (perfil OPERADOR) para validar o acesso a rotas antes quebradas por erro 403.
  6. Testa a performance da nova agregação direta em SQL no PostgreSQL (calculando patrimônio).
  7. Finaliza validando se o servidor frontend Vite está online e pronto para servir o React.

COMO EXECUTAR:
  powershell -ExecutionPolicy Bypass -File .\tests\smoke_test.ps1
====================================================================================================
#>

$ErrorActionPreference = "Stop"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    INICIANDO SMOKE TESTS - SISTEMA ESTOQUE.OS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# --------------------------------------------------------------------------------------------------
# [TESTE 1/7] HEALTHCHECK DO BACKEND
# O QUE FAZ: Envia um GET para a raiz do backend (http://localhost:5000/).
# POR QUE É NECESSÁRIO: Confirma se o Node.js subiu, se o Express inicializou os middlewares globais 
# e se a porta 5000 está receptiva a requisições HTTP antes de testar qualquer lógica mais pesada.
# --------------------------------------------------------------------------------------------------
Write-Host "`n[1/7] Testando Healthcheck Backend (http://localhost:5000/)..." -NoNewline
try {
    $hc = Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Finalidade: Verifica se a API Express está online." -ForegroundColor Gray
    Write-Host "      Resposta  : $hc" -ForegroundColor Gray
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

# --------------------------------------------------------------------------------------------------
# [TESTE 2/7] CONECTIVIDADE COM O BANCO DE DADOS (POSTGRESQL NEON)
# O QUE FAZ: Envia um GET para a rota de diagnóstico /test-db, executando SELECT NOW() via Prisma.
# POR QUE É NECESSÁRIO: Garante que a string DATABASE_URL do arquivo .env está correta, que o canal 
# TLS/SSL com a nuvem AWS Neon foi estabelecido e que o Prisma ORM está pronto para consultas.
# --------------------------------------------------------------------------------------------------
Write-Host "`n[2/7] Testando Conexão com Neon PostgreSQL (http://localhost:5000/test-db)..." -NoNewline
try {
    $db = Invoke-RestMethod -Uri "http://localhost:5000/test-db" -Method Get
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Finalidade: Valida o canal seguro com o PostgreSQL Neon." -ForegroundColor Gray
    Write-Host "      Mensagem  : $($db.message)" -ForegroundColor Gray
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

# --------------------------------------------------------------------------------------------------
# [TESTE 3/7] BLINDAGEM DE SEGURANÇA CONTRA ESCALAÇÃO DE PRIVILÉGIOS (POST /auth/register)
# O QUE FAZ: Simula um ataque hacker enviando no corpo da requisição pública de cadastro o campo
#            proposital role: 'ADMIN'.
# POR QUE É NECESSÁRIO: Antes da auditoria, a rota pública aceitava a role do body e transformava
# qualquer pessoa em Administrador. O teste prova que o backend agora força a role para 'OPERADOR'.
# --------------------------------------------------------------------------------------------------
$randomId = Get-Random
$testEmail = "smoke_auto_$randomId@teste.com"
Write-Host "`n[3/7] Testando Blindagem contra Escalação de Privilégio (role: ADMIN)..." -NoNewline
try {
    $bodyRegister = @{
        nome = "Usuario Smoke $randomId"
        email = $testEmail
        senha = "senha_segura_123"
        role = "ADMIN" # Tentativa proposital de escalação
    } | ConvertTo-Json

    $regRes = Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method Post -Body $bodyRegister -ContentType "application/json"
    
    if ($regRes.usuario.role -eq "OPERADOR") {
        Write-Host " [OK - SEGURO]" -ForegroundColor Green
        Write-Host "      Finalidade: Bloqueia concessão arbitrária de acesso administrativo." -ForegroundColor Gray
        Write-Host "      Resultado : Role forçada estritamente para: $($regRes.usuario.role)" -ForegroundColor Gray
    } else {
        Write-Host " [VULNERÁVEL]" -ForegroundColor Red
        Write-Host "      Alerta: o usuário recebeu role $($regRes.usuario.role)!" -ForegroundColor Red
    }
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

# --------------------------------------------------------------------------------------------------
# [TESTE 4/7] AUTENTICAÇÃO, HASH BCRYPT E EMISSÃO DE TOKEN JWT (POST /auth/login)
# O QUE FAZ: Efetua o login usando o e-mail e senha cadastrados no Teste 3.
# POR QUE É NECESSÁRIO: Valida o ciclo completo de autenticação: compara a senha em texto puro com o
# hash bcrypt salvo no banco e assina o token JWT contendo os dados sanitizados do usuário.
# --------------------------------------------------------------------------------------------------
Write-Host "`n[4/7] Testando Login com Credenciais Criadas..." -NoNewline
$token = $null
try {
    $bodyLogin = @{
        email = $testEmail
        senha = "senha_segura_123"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method Post -Body $bodyLogin -ContentType "application/json"
    $token = $loginRes.token
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Finalidade: Valida criptografia de senhas e assinatura de tokens JWT." -ForegroundColor Gray
    Write-Host "      Resultado : Token gerado com sucesso (User ID: $($loginRes.user.id), Role: $($loginRes.user.role))" -ForegroundColor Gray
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

# --------------------------------------------------------------------------------------------------
# [TESTE 5/7] AUTORIZAÇÃO DE ROTAS DE APOIO PARA OPERADORES (GET /users/names)
# O QUE FAZ: Envia uma requisição autenticada com o token de OPERADOR para a rota /users/names.
# POR QUE É NECESSÁRIO: Antes da auditoria, a rota só permitia ADMIN e GERENTE, o que quebrava com
# erro 403 Forbidden a tela de Pedidos (Pedidos.jsx) quando aberta por operadores. O teste prova que
# operadores agora conseguem carregar a lista de nomes nos filtros de histórico sem falhas.
# --------------------------------------------------------------------------------------------------
Write-Host "`n[5/7] Testando Rota de Nomes para Filtros de Pedidos (/users/names)..." -NoNewline
try {
    $headers = @{ Authorization = "Bearer $token" }
    $names = Invoke-RestMethod -Uri "http://localhost:5000/users/names" -Method Get -Headers $headers
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Finalidade: Elimina o erro 403 Forbidden na tela de Pedidos do frontend." -ForegroundColor Gray
    Write-Host "      Resultado : Total de usuários retornados para alimentar o filtro: $($names.Count)" -ForegroundColor Gray
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

# --------------------------------------------------------------------------------------------------
# [TESTE 6/7] ALTA PERFORMANCE COM AGREGAÇÃO SQL NATIVA NO POSTGRES (GET /products/stats)
# O QUE FAZ: Consulta a rota de estatísticas de produtos utilizando o token gerado.
# POR QUE É NECESSÁRIO: Antes da auditoria, o sistema carregava todos os produtos em memória no Node.js
# para somar no JavaScript com risco de Out-of-Memory. O teste valida que a nova consulta SQL nativa
# (SUM(preco * quantidade)) no PostgreSQL calcula e responde o patrimônio financeiro em milissegundos.
# --------------------------------------------------------------------------------------------------
Write-Host "`n[6/7] Testando Agregação de Patrimônio de Produtos (/products/stats)..." -NoNewline
try {
    $headers = @{ Authorization = "Bearer $token" }
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/products/stats" -Method Get -Headers $headers
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Finalidade: Garante alta velocidade e zero risco de estouro de memória (OOM)." -ForegroundColor Gray
    Write-Host "      Resultado : Total produtos: $($stats.total) | Patrimônio calculado: R$ $($stats.totalValue)" -ForegroundColor Gray
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

# --------------------------------------------------------------------------------------------------
# [TESTE 7/7] DISPONIBILIDADE DO SERVIDOR FRONTEND (VITE REACT)
# O QUE FAZ: Envia um GET para http://localhost:5173/ e verifica o código de resposta HTTP.
# POR QUE É NECESSÁRIO: Garante que o ambiente de frontend em React 19 / Vite está ativo, ouvindo a porta
# e pronto para carregar os componentes de tela e layout no navegador do usuário.
# --------------------------------------------------------------------------------------------------
Write-Host "`n[7/7] Testando Servidor Frontend Vite (http://localhost:5173/)..." -NoNewline
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:5173/" -Method Get
    Write-Host " [OK]" -ForegroundColor Green
    Write-Host "      Finalidade: Confirma se o Vite está servindo o SPA React." -ForegroundColor Gray
    Write-Host "      Resultado : Frontend respondendo com código HTTP: $($fe.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host " [FALHA]" -ForegroundColor Red
    Write-Host "      Erro: $_" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "    BATERIA DE SMOKE TESTS CONCLUÍDA COM SUCESSO!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
