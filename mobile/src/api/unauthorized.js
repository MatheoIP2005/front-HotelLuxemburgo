let unauthorizedHandler = async () => {};

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === "function" ? handler : async () => {};
};

export const handleUnauthorized = async () => {
  await unauthorizedHandler();
};
