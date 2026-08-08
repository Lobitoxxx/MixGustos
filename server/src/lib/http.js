// Utilidades de respuesta para mantener consistencia en toda la API.
export const ok = (res, data, status = 200) => res.status(status).json(data);
export const created = (res, data) => res.status(201).json(data);
export const fail = (res, message, status = 400) => res.status(status).json({ error: message });
