import axios from 'axios';

const BASE_URL = import.meta.env.VITE_NOCODB_URL;
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

const api = axios.create({
  baseURL: BASE_URL + '/api/v2/tables/',
  headers: {
    'xc-token': TOKEN,
    'Content-Type': 'application/json',
  }
});

// --- AUTH - ADMIN ---
export const loginAdmin = async (email, password) => {
  const { data } = await api.get('m98ivs3k3csc04e/records');
  return data.list.find(user => user.email === email && user.password === password);
};

// --- AUTH - USERS ---
export const listarUsuarios = async () => {
  const { data } = await api.get('msehqhsr7j040uq/records');
  return data.list;
};

export const criarUsuario = async (payload) => {
  const { data } = await api.post('msehqhsr7j040uq/records', payload);
  return data;
};

export const atualizarUsuario = async (id, payload) => {
  const { data } = await api.patch(`msehqhsr7j040uq/records/${id}`, payload);
  return data;
};

export const deletarUsuario = async (id) => {
  const { data } = await api.delete('msehqhsr7j040uq/records', {
    data: { Id: id }
  });
  return data;
};

// --- KM - CONTROL ---
export const listarRegistrosKm = async () => {
  const { data } = await api.get('m0hj8eje9k5w4c0/records');
  return data.list;
};

export const salvarRegistroKm = async (payload) => {
  const { data } = await api.post('m0hj8eje9k5w4c0/records', payload);
  return data;
};

export const atualizarRegistroKm = async (id, payload) => {
  const { data } = await api.patch(`m0hj8eje9k5w4c0/records/${id}`, payload);
  return data;
};

// --- VEHICLE ---
export const listarVeiculos = async () => {
  const { data } = await api.get('m1sy388a4zv1kgl/records');
  return data.list;
};

export const atualizarVeiculo = async (id, payload) => {
  const { data } = await api.patch(`m1sy388a4zv1kgl/records/${id}`, payload);
  return data;
};

// --- VEHICLE STANDARD ---
export const listarVeiculosEmpresa = async () => {
  const { data } = await api.get('mz92fb5ps4z32br/records');
  return data.list;
};

export const atualizarVeiculoEmpresa = async (id, payload) => {
  const { data } = await api.patch(`mz92fb5ps4z32br/records/${id}`, payload);
  return data;
};

export default api;
