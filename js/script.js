let instanciaGrafico = null;

// --- FUNÇÕES DE AUTO-PREENCHIMENTO ---

// 1. Auto-preencher Seção de Capital de Giro com base na Seção Operacional
function preencherAutomaticamenteDadosOperacionais() {
    const precoVenda = obterValorCampo('precoVendaUnitario');
    const custoVariavel = obterValorCampo('custoVariavelUnitario');
    const quantidade = obterValorCampo('quantidadeVendida');

    if (precoVenda === null || custoVariavel === null || quantidade === null) {
        alert("Por favor, preencha o Preço de Venda, Custo Variável e Quantidade na seção 'Dados Operacionais' primeiro.");
        return;
    }

    const receitaTotalCalculada = precoVenda * quantidade;
    const custoMercadoriasVendidasCalculado = custoVariavel * quantidade; 

    definirValorCampo('receitaTotalAnual', receitaTotalCalculada);
    definirValorCampo('custoMercadoriasVendidas', custoMercadoriasVendidasCalculado);
}

// 2. Estimar Seção Financeira com base em dados Operacionais e de Capital de Giro
function estimarDadosFinanceiros() {
    const estoque = obterValorCampo('estoqueMedio') || 0;
    const contasReceber = obterValorCampo('contasReceberMedio') || 0;
    const fornecedores = obterValorCampo('fornecedoresMedio') || 0;
    
    // Calcular Lucro Operacional para sugerir Lucro Líquido
    const precoVenda = obterValorCampo('precoVendaUnitario');
    const custoVariavel = obterValorCampo('custoVariavelUnitario');
    const custoFixo = obterValorCampo('custosFixosTotais');
    const quantidade = obterValorCampo('quantidadeVendida');
    
    let lucroLiquidoEstimado = 0;
    
    // Tenta calcular o Lucro Operacional (EBIT) se possível
    if (precoVenda !== null && custoVariavel !== null && custoFixo !== null && quantidade !== null) {
        const margemContribuicaoUnitario = precoVenda - custoVariavel;
        const lucroOperacional = (quantidade * margemContribuicaoUnitario) - custoFixo;
        lucroLiquidoEstimado = lucroOperacional; // Sugere EBIT como base, usuário ajusta impostos
    }

    // Lógica de Estimativa Contábil
    // Ativo Circulante mínimo = Estoque + Contas a Receber
    const ativoCirculanteEstimado = estoque + contasReceber;
    
    // Passivo Circulante mínimo = Fornecedores
    const passivoCirculanteEstimado = fornecedores;

    // Ativo Total mínimo = Ativo Circulante (Assumindo zero Ativo Não Circulante inicialmente)
    const ativoTotalEstimado = ativoCirculanteEstimado;

    // Preenche apenas se o campo estiver vazio
    if(!obterValorCampo('ativoCirculante')) definirValorCampo('ativoCirculante', ativoCirculanteEstimado);
    if(!obterValorCampo('passivoCirculante')) definirValorCampo('passivoCirculante', passivoCirculanteEstimado);
    if(!obterValorCampo('ativoTotal')) definirValorCampo('ativoTotal', ativoTotalEstimado); // Usuário deve corrigir adicionando Imobilizado
    if(!obterValorCampo('lucroLiquido')) definirValorCampo('lucroLiquido', lucroLiquidoEstimado);
    
    // Patrimônio Líquido é Ativo - Passivo. 
    if(!obterValorCampo('patrimonioLiquido')) {
            const patrimonioLiquidoEstimado = ativoTotalEstimado - passivoCirculanteEstimado;
            definirValorCampo('patrimonioLiquido', patrimonioLiquidoEstimado > 0 ? patrimonioLiquidoEstimado : 0);
    }
    
    alert("Valores estimados com base nos dados anteriores.\n\nLEMBRETES TÉCNICOS:\n1. Adicione o saldo de 'Disponibilidades' (Caixa/Bancos) ao Ativo Circulante.\n2. Deduza 'Imposto de Renda' e 'Despesas Financeiras' para o Lucro Líquido real.\n3. Ajuste o Ativo Total somando o 'Ativo Não Circulante' (Imobilizado, Intangível).");
}

// --- FUNÇÕES AUXILIARES DE FORMATAÇÃO E LEITURA ---

// Formata o campo de input visualmente enquanto o usuário digita
function formatarMoedaAoDigitar(elementoInput) {
    let valorTexto = elementoInput.value.replace(/\D/g, "");
    if (valorTexto === "") return;
    
    const valorFormatado = (parseFloat(valorTexto) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
    elementoInput.value = valorFormatado;
}

// Define valor numérico em um campo e aplica máscara
function definirValorCampo(idElemento, valorNumerico) {
    const elementoInput = document.getElementById(idElemento);
    // Fixa 2 casas decimais e troca ponto por virgula para a função de máscara funcionar bem se fosse string
    // Mas como usamos toLocaleString na formatação, vamos simular a entrada
    elementoInput.value = valorNumerico.toFixed(2).replace('.', ',');
    formatarMoedaAoDigitar(elementoInput);
}

// Obtém o valor numérico limpo (float) de um input
function obterValorCampo(idElemento) {
    let valorTexto = document.getElementById(idElemento).value;
    if (valorTexto === '' || valorTexto === null) return null;
    
    // Se tiver caracteres de moeda, limpa
    if (typeof valorTexto === 'string' && (valorTexto.includes('R$') || valorTexto.includes(',') || valorTexto.includes('.'))) {
        // Remove tudo que não é dígito ou vírgula
        // Ex: R$ 1.500,00 -> 1500,00 -> 1500.00
        valorTexto = valorTexto.replace(/[^\d,]/g, '').replace(',', '.');
    }
    
    const valorNumerico = parseFloat(valorTexto);
    return isNaN(valorNumerico) ? null : valorNumerico;
}

// Formata número float para string de moeda BRL para exibição em texto (spans)
function formatarValorMonetario(valorNumerico) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico);
}

// --- LÓGICA PRINCIPAL DE CÁLCULOS ---

function processarTodosCalculosContabeis() {
    document.getElementById('secaoResultados').classList.add('mostrar');
    
    processarIndicadoresOperacionais();
    processarCiclosFinanceiros();
    processarIndicadoresFinanceiros();
}

function processarIndicadoresOperacionais() {
    const precoVenda = obterValorCampo('precoVendaUnitario');
    const custoVariavel = obterValorCampo('custoVariavelUnitario');
    const custosFixos = obterValorCampo('custosFixosTotais');
    const quantidade = obterValorCampo('quantidadeVendida');

    const elementoErro = document.getElementById('caixaErroOperacional');
    const elementoConteudo = document.getElementById('conteudoOperacional');
    const elementoContainerGrafico = document.getElementById('containerGrafico');

    let camposFaltantes = [];
    if (precoVenda === null) camposFaltantes.push("Preço de Venda");
    if (custoVariavel === null) camposFaltantes.push("Custo Variável");
    if (custosFixos === null) camposFaltantes.push("Custos Fixos");

    // Resetar estado visual
    elementoErro.style.display = 'none';
    elementoConteudo.style.opacity = '1';
    elementoContainerGrafico.style.display = 'block';

    if (camposFaltantes.length > 0) {
        elementoErro.style.display = 'block';
        elementoErro.innerHTML = `Faltam dados essenciais: ${camposFaltantes.join(', ')}`;
        elementoConteudo.style.opacity = '0.3';
        elementoContainerGrafico.style.display = 'none';
        return; 
    }

    // Cálculos da Margem de Contribuição e Ponto de Equilíbrio
    const margemContribuicaoUnitario = precoVenda - custoVariavel;
    const margemContribuicaoPercentual = (margemContribuicaoUnitario / precoVenda) * 100;
    
    // Ponto de Equilíbrio Contábil (PEC)
    const pontoEquilibrioQuantidade = custosFixos / margemContribuicaoUnitario;
    const pontoEquilibrioValor = pontoEquilibrioQuantidade * precoVenda;

    // Exibição
    document.getElementById('resultadoMargemContribuicaoUnitario').innerText = formatarValorMonetario(margemContribuicaoUnitario);
    document.getElementById('resultadoMargemContribuicaoPercentual').innerText = margemContribuicaoPercentual.toFixed(1) + '%';
    document.getElementById('resultadoPontoEquilibrioQuantidade').innerText = Math.ceil(pontoEquilibrioQuantidade) + ' un';
    document.getElementById('resultadoPontoEquilibrioValor').innerText = formatarValorMonetario(pontoEquilibrioValor);

    // Se houver quantidade vendida, calcula Alavancagem e Lucro
    if (quantidade !== null) {
        const lucroOperacional = (quantidade * margemContribuicaoUnitario) - custosFixos;
        const margemContribuicaoTotal = quantidade * margemContribuicaoUnitario;
        
        // Grau de Alavancagem Operacional (GAO) = Margem Contribuição Total / Lucro Operacional
        let grauAlavancagemOperacional = lucroOperacional !== 0 ? (margemContribuicaoTotal / lucroOperacional) : 0;

        document.getElementById('resultadoGrauAlavancagemOperacional').innerText = grauAlavancagemOperacional.toFixed(2) + 'x';
        
        const elementoLucro = document.getElementById('resultadoLucroOperacional');
        elementoLucro.innerText = formatarValorMonetario(lucroOperacional);
        elementoLucro.className = lucroOperacional >= 0 ? 'valor-resultado destaque' : 'valor-resultado aviso';
        
        renderizarGraficoPontoEquilibrio(precoVenda, custoVariavel, custosFixos, quantidade, pontoEquilibrioQuantidade);
    } else {
        document.getElementById('resultadoGrauAlavancagemOperacional').innerText = "-";
        document.getElementById('resultadoLucroOperacional').innerText = "-";
        // Renderiza gráfico apenas com a projeção do ponto de equilibrio
        renderizarGraficoPontoEquilibrio(precoVenda, custoVariavel, custosFixos, pontoEquilibrioQuantidade * 1.2, pontoEquilibrioQuantidade);
    }
}

function processarCiclosFinanceiros() {
    const estoque = obterValorCampo('estoqueMedio');
    const contasReceber = obterValorCampo('contasReceberMedio');
    const fornecedores = obterValorCampo('fornecedoresMedio');
    const custoMercadorias = obterValorCampo('custoMercadoriasVendidas');
    const receitaTotal = obterValorCampo('receitaTotalAnual');
    const diasNoAno = 365;

    const elementoErro = document.getElementById('caixaErroCiclos');
    const elementoConteudo = document.getElementById('conteudoCiclos');
    
    if (custoMercadorias === null || receitaTotal === null) {
        elementoErro.style.display = 'block';
        elementoErro.innerHTML = `Necessário informar CMV e Receita Total para calcular os prazos médios.`;
        elementoConteudo.style.opacity = '0.3';
        return;
    } else {
        elementoErro.style.display = 'none';
        elementoConteudo.style.opacity = '1';
    }

    let prazoMedioEstocagem = 0;
    let prazoMedioRecebimento = 0;
    let prazoMedioPagamento = 0;
    
    let possuiPME = false;
    let possuiPMR = false;
    let possuiPMP = false;

    // PME = (Estoque / CMV) * 365
    if (estoque !== null && custoMercadorias !== 0) {
        prazoMedioEstocagem = (estoque / custoMercadorias) * diasNoAno;
        document.getElementById('resultadoPrazoMedioEstocagem').innerText = Math.round(prazoMedioEstocagem) + ' dias';
        possuiPME = true;
    }

    // PMR = (Contas a Receber / Receita) * 365
    if (contasReceber !== null && receitaTotal !== 0) {
        prazoMedioRecebimento = (contasReceber / receitaTotal) * diasNoAno;
        document.getElementById('resultadoPrazoMedioRecebimento').innerText = Math.round(prazoMedioRecebimento) + ' dias';
        possuiPMR = true;
    }

    // PMP = (Fornecedores / CMV) * 365 (Proxy usando CMV no lugar de Compras)
    if (fornecedores !== null && custoMercadorias !== 0) {
        prazoMedioPagamento = (fornecedores / custoMercadorias) * diasNoAno;
        document.getElementById('resultadoPrazoMedioPagamento').innerText = Math.round(prazoMedioPagamento) + ' dias';
        possuiPMP = true;
    }

    // Ciclo Operacional = PME + PMR
    if (possuiPME && possuiPMR) {
        const cicloOperacional = prazoMedioEstocagem + prazoMedioRecebimento;
        document.getElementById('resultadoCicloOperacional').innerText = Math.round(cicloOperacional) + ' dias';
    } else {
        document.getElementById('resultadoCicloOperacional').innerText = "-";
    }

    // Ciclo de Conversão de Caixa (CCC) = Ciclo Operacional - PMP
    if (possuiPME && possuiPMR && possuiPMP) {
        const cicloConversaoCaixa = (prazoMedioEstocagem + prazoMedioRecebimento) - prazoMedioPagamento;
        const elementoCCC = document.getElementById('resultadoCicloConversaoCaixa');
        elementoCCC.innerText = Math.round(cicloConversaoCaixa) + ' dias';
        // CCC negativo é bom (financiado pelos fornecedores), positivo exige capital de giro
        elementoCCC.className = cicloConversaoCaixa <= 0 ? 'valor-resultado destaque' : 'valor-resultado aviso';
    }
}

function processarIndicadoresFinanceiros() {
    const ativoCirculante = obterValorCampo('ativoCirculante');
    const passivoCirculante = obterValorCampo('passivoCirculante');
    const estoque = obterValorCampo('estoqueMedio') || 0;
    const lucroLiquido = obterValorCampo('lucroLiquido');
    const receitaTotal = obterValorCampo('receitaTotalAnual');
    const patrimonioLiquido = obterValorCampo('patrimonioLiquido');
    const ativoTotal = obterValorCampo('ativoTotal');

    const elementoErro = document.getElementById('caixaErroFinanceiro');
    const elementoConteudo = document.getElementById('conteudoFinanceiro');

    // Validação mínima para Liquidez
    if (ativoCirculante === null || passivoCirculante === null) {
        elementoErro.style.display = 'block';
        elementoErro.innerHTML = "Preencha Ativo Circulante e Passivo Circulante para calcular liquidez.";
        elementoConteudo.style.opacity = '0.3';
        return;
    }

    elementoErro.style.display = 'none';
    elementoConteudo.style.opacity = '1';

    // 1. Índices de Liquidez
    if(passivoCirculante !== 0) {
        const liquidezCorrente = ativoCirculante / passivoCirculante;
        const liquidezSeca = (ativoCirculante - estoque) / passivoCirculante;
        
        const elementoLiqCorrente = document.getElementById('resultadoLiquidezCorrente');
        elementoLiqCorrente.innerText = liquidezCorrente.toFixed(2);
        elementoLiqCorrente.className = liquidezCorrente >= 1 ? 'valor-resultado destaque' : 'valor-resultado aviso';

        document.getElementById('resultadoLiquidezSeca').innerText = liquidezSeca.toFixed(2);
    }

    // 2. Índices de Rentabilidade
    // Margem Líquida = Lucro Líquido / Receita Total
    if(lucroLiquido !== null && receitaTotal !== null && receitaTotal !== 0) {
        const margemLiquida = (lucroLiquido / receitaTotal) * 100;
        const elementoMargemLiq = document.getElementById('resultadoMargemLiquida');
        elementoMargemLiq.innerText = margemLiquida.toFixed(1) + '%';
        elementoMargemLiq.className = margemLiquida > 0 ? 'valor-resultado' : 'valor-resultado aviso';
    }

    // ROE (Retorno sobre Patrimônio Líquido) = Lucro Líquido / PL
    if(lucroLiquido !== null && patrimonioLiquido !== null && patrimonioLiquido !== 0) {
        const retornoSobrePatrimonio = (lucroLiquido / patrimonioLiquido) * 100;
        document.getElementById('resultadoRetornoSobrePatrimonio').innerText = retornoSobrePatrimonio.toFixed(1) + '%';
    } else {
            document.getElementById('resultadoRetornoSobrePatrimonio').innerText = "-";
    }

    // ROA (Retorno sobre Ativo) = Lucro Líquido / Ativo Total
    if(lucroLiquido !== null && ativoTotal !== null && ativoTotal !== 0) {
        const retornoSobreAtivo = (lucroLiquido / ativoTotal) * 100;
        document.getElementById('resultadoRetornoSobreAtivo').innerText = retornoSobreAtivo.toFixed(1) + '%';
    } else {
            document.getElementById('resultadoRetornoSobreAtivo').innerText = "-";
    }
}

function renderizarGraficoPontoEquilibrio(precoVenda, custoVariavel, custosFixos, quantidadeLimite, quantidadePontoEquilibrio) {
    const contextoCanvas = document.getElementById('graficoPontoEquilibrio').getContext('2d');
    
    // Define o limite do eixo X (1.5x o maior valor entre o PE e a quantidade atual)
    const quantidadeMaximaGrafico = Math.max(quantidadeLimite, quantidadePontoEquilibrio) * 1.5;
    const passoGrafico = quantidadeMaximaGrafico / 15; 
    
    let rotulosEixoX = [];
    let dadosCustosTotais = [];
    let dadosReceitaTotal = [];

    for(let i = 0; i <= quantidadeMaximaGrafico; i += passoGrafico) {
        let quantidadeAtual = Math.round(i);
        rotulosEixoX.push(quantidadeAtual);
        dadosReceitaTotal.push(quantidadeAtual * precoVenda);
        dadosCustosTotais.push(custosFixos + (quantidadeAtual * custoVariavel));
    }

    if(instanciaGrafico) instanciaGrafico.destroy();

    instanciaGrafico = new Chart(contextoCanvas, {
        type: 'line',
        data: {
            labels: rotulosEixoX,
            datasets: [
                {
                    label: 'Receita Total',
                    data: dadosReceitaTotal,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2
                },
                {
                    label: 'Custos Totais',
                    data: dadosCustosTotais,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(contexto) {
                            let rotulo = contexto.dataset.label || '';
                            if (rotulo) rotulo += ': ';
                            if (contexto.parsed.y !== null) {
                                rotulo += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contexto.parsed.y);
                            }
                            return rotulo;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(valor) { return 'R$ ' + (valor/1000).toFixed(0) + 'k'; }
                    }
                }
            }
        }
    });
}