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
  const { data } = await api.get('m1b5pe8z01t5uz1/records');
  return data.list.find(user => user.email === email && user.password === password);
};

// --- AUTH - USERS ---
export const listarUsuarios = async () => {
  const { data } = await api.get('mngm0skrjiqa8cf/records');
  return data.list;
};

export const criarUsuario = async (payload) => {
  const { data } = await api.post('mngm0skrjiqa8cf/records', payload);
  return data;
};

export const atualizarUsuario = async (id, payload) => {
  const { data } = await api.patch(`mngm0skrjiqa8cf/records/${id}`, payload);
  return data;
};

export const deletarUsuario = async (id) => {
  const { data } = await api.delete('mngm0skrjiqa8cf/records', {
    data: { Id: id }
  });
  return data;
};

// --- KM - CONTROL ---
export const listarRegistrosKm = async () => {
  const { data } = await api.get('mcfjf5y9bb4z5h0/records');
  return data.list;
};

export const salvarRegistroKm = async (payload) => {
  const { data } = await api.post('mcfjf5y9bb4z5h0/records', payload);
  return data;
};

export const atualizarRegistroKm = async (id, payload) => {
  const { data } = await api.patch(`mcfjf5y9bb4z5h0/records/${id}`, payload);
  return data;
};

// --- VEHICLE ---
export const listarVeiculos = async () => {
  const { data } = await api.get('md6hsq8rx1mmxg2/records');
  return data.list;
};

export const atualizarVeiculo = async (id, payload) => {
  const { data } = await api.patch(`md6hsq8rx1mmxg2/records/${id}`, payload);
  return data;
};

// --- VEHICLE STANDARD ---
export const listarVeiculosEmpresa = async () => {
  const { data } = await api.get('mu0erb59zudhecf/records');
  return data.list;
};

export const atualizarVeiculoEmpresa = async (id, payload) => {
  const { data } = await api.patch(`mu0erb59zudhecf/records/${id}`, payload);
  return data;
};

export default api;
