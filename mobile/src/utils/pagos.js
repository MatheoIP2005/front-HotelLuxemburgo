import { PAGO_METODOS } from "./constraints";
import { parsePositiveNumber } from "./numeric";

export const validatePagoForm = (form, selectedFactura) => {
  const errors = {};
  const monto = parsePositiveNumber(form.monto);

  if (!form.factura_guid) {
    errors.factura_guid = "Seleccione una factura válida.";
  } else if (!selectedFactura) {
    errors.factura_guid = "La factura seleccionada no está disponible para pago.";
  } else if (selectedFactura.estado !== "EMI") {
    errors.factura_guid = "Solo se pueden registrar pagos sobre facturas emitidas (EMI).";
  } else if (Number(selectedFactura.saldoPendiente ?? 0) <= 0) {
    errors.factura_guid = "La factura seleccionada no tiene saldo pendiente.";
  }

  if (!form.monto) {
    errors.monto = "El monto es obligatorio.";
  } else if (monto === null || Number.isNaN(monto)) {
    errors.monto = "El monto debe ser mayor a cero.";
  } else if (selectedFactura && monto > Number(selectedFactura.saldoPendiente ?? 0)) {
    errors.monto = "El monto no puede exceder el saldo pendiente de la factura.";
  }

  if (!PAGO_METODOS.includes(form.metodo_pago)) {
    errors.metodo_pago = "Seleccione un método válido.";
  }

  return errors;
};
