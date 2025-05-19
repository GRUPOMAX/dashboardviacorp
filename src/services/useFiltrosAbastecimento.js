// src/services/useFiltrosAbastecimento.js
import dayjs from 'dayjs';

export function useFiltrosAbastecimento(registros, veiculosUsuario, veiculosEmpresa, dataInicio, dataFim) {
  const filtrarPorData = (dataRegistro, inicio, fim) => {
    if (!inicio || !fim) return true;
    const data = dayjs(dataRegistro);
    const dataInicioObj = dayjs(inicio);
    const dataFimObj = dayjs(fim);
    if (dataInicioObj.isAfter(dataFimObj)) return false;
    return data.isSameOrAfter(dataInicioObj.startOf('day')) && data.isSameOrBefore(dataFimObj.endOf('day'));
  };

  // 🔄 Abastecimentos via KM-CONTROL
  const kmEntries = registros.flatMap(r =>
    Object.values(r['KM-CONTROL-SEMANAL'] || {}).flat()
  ).filter(item => filtrarPorData(item?.['KM-Control']?.DATA, dataInicio, dataFim));

  // ✅ Calcula litros para veículos do usuário
  const litrosVeiculosUsuarioNoPeriodo = veiculosUsuario.map(v => {
    const nome = v['MODEL-VEHICLE'];

    // Soma do KM-CONTROL
    const registrosVeiculo = kmEntries.filter(item =>
      item?.['KM-Control']?.VEICULO === nome && item?.['KM-Control']?.ABASTECEU
    );
    const litrosKM = registrosVeiculo.reduce((total, item) =>
      total + Number(item?.['KM-Control']?.LITROS_ABASTECIDOS || 0), 0
    );

    // Soma do ABASTECIMENTO-ZERADO
    const zerado = v['ABASTECIMENTO-ZERADO'];
    let listaZerado = [];
    if (typeof zerado === 'string') {
      try {
        listaZerado = JSON.parse(zerado);
      } catch {
        listaZerado = [];
      }
    } else if (Array.isArray(zerado)) {
      listaZerado = zerado;
    }

    const litrosZerado = listaZerado
      .filter(item => filtrarPorData(item?.data, dataInicio, dataFim))
      .reduce((total, item) => total + Number(item?.litros || 0), 0);

    return {
      ...v,
      litrosPeriodo: litrosKM + litrosZerado
    };
  });

  // ✅ Calcula para veículos da empresa com comprovante
  const comprovantesEmpresa = veiculosEmpresa.flatMap(v => {
    const comp = v.comprovante;
    if (typeof comp === 'string') {
      try {
        return JSON.parse(comp);
      } catch {
        return [];
      }
    }
    return Array.isArray(comp) ? comp : [];
  }).filter(item => filtrarPorData(item?.data, dataInicio, dataFim));

  const litrosVeiculosEmpresaNoPeriodo = veiculosEmpresa.flatMap(v => {
    let lista = v['Vehicle-Standard'];
    if (typeof lista === 'string') {
      try {
        lista = JSON.parse(lista);
      } catch {
        return [];
      }
    }
    return (lista || []).map(veic => {
      const comprovantes = comprovantesEmpresa.filter(c => c.veiculo === veic.veiculo);
      const litrosPeriodo = comprovantes.reduce((total, c) =>
        total + Number(c.litros || 0), 0
      );
      return {
        ...veic,
        litrosPeriodo
      };
    });
  });

  // Totais
  const totalAbastecimentos =
    litrosVeiculosUsuarioNoPeriodo.filter(v => Number(v.litrosPeriodo || 0) > 0).length +
    litrosVeiculosEmpresaNoPeriodo.filter(v => Number(v.litrosPeriodo || 0) > 0).length;

  const totalLitros =
    litrosVeiculosUsuarioNoPeriodo.reduce((total, v) => total + Number(v.litrosPeriodo || 0), 0) +
    litrosVeiculosEmpresaNoPeriodo.reduce((total, v) => total + Number(v.litrosPeriodo || 0), 0);

  const litrosPorVeiculo = {};
  litrosVeiculosUsuarioNoPeriodo.forEach(v => {
    const nome = v['MODEL-VEHICLE'];
    litrosPorVeiculo[nome] = (litrosPorVeiculo[nome] || 0) + Number(v.litrosPeriodo || 0);
  });

  litrosVeiculosEmpresaNoPeriodo.forEach(v => {
    const nome = v.veiculo;
    litrosPorVeiculo[nome] = (litrosPorVeiculo[nome] || 0) + Number(v.litrosPeriodo || 0);
  });

  return {
    litrosVeiculosUsuarioNoPeriodo,
    litrosVeiculosEmpresaNoPeriodo,
    totalAbastecimentos,
    totalLitros,
    litrosPorVeiculo
  };
}
