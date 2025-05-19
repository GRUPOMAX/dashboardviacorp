// dashboardviacorp/src/services/useRequisicoesAbastecimento.js
import { useEffect, useState } from 'react';
import { listarRegistrosKm, listarVeiculos, listarVeiculosEmpresa } from './api';

export function useRequisicoesAbastecimento() {
  const [registros, setRegistros] = useState([]);
  const [veiculosUsuario, setVeiculosUsuario] = useState([]);
  const [veiculosEmpresa, setVeiculosEmpresa] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(Date.now()); // 👈 novo estado

  useEffect(() => {
    const carregar = async () => {
      try {
        const [km, userVeiculos, empresaVeiculos] = await Promise.all([
          listarRegistrosKm(),
          listarVeiculos(),
          listarVeiculosEmpresa()
        ]);

        setRegistros(km);
        setVeiculosUsuario(userVeiculos);
        setVeiculosEmpresa(empresaVeiculos);
        setUpdateTrigger(Date.now()); // 👈 força atualização
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
    const intervalo = setInterval(() => carregar(), 8000);
    return () => clearInterval(intervalo);
  }, []);

  return {
    registros,
    veiculosUsuario,
    veiculosEmpresa,
    carregando,
    updateTrigger // 👈 exporta para o PainelAbastecimento
  };
}
