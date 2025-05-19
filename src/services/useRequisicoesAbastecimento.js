// dashboardviacorp/src/services/useRequisicoesAbastecimento.js
import { useEffect, useState } from 'react';
import { listarRegistrosKm, listarVeiculos, listarVeiculosEmpresa } from './api';

export function useRequisicoesAbastecimento() {
  const [registros, setRegistros] = useState([]);
  const [veiculosUsuario, setVeiculosUsuario] = useState([]);
  const [veiculosEmpresa, setVeiculosEmpresa] = useState([]);
  const [carregando, setCarregando] = useState(true);

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
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
    const intervalo = setInterval(() => carregar(), 15000);
    return () => clearInterval(intervalo);
  }, []);

  return {
    registros,
    veiculosUsuario,
    veiculosEmpresa,
    carregando,
  };
}
