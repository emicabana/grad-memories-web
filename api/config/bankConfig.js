// Configuración de datos bancarios para transferencias
const bankConfig = {
  // Datos de la cuenta bancaria
  bankDetails: {
    bankName: process.env.BANK_NAME || 'Banco Prototipo',
    accountHolder: process.env.ACCOUNT_HOLDER || 'GradMemories',
    cbu: process.env.BANK_CBU || '1900000000000000000000', // Ejemplo CBU
    cuit: process.env.BANK_CUIT || '30-00000000-0', // Ejemplo CUIT
    accountNumber: process.env.BANK_ACCOUNT || '0000000000',
    accountType: 'Cuenta Corriente',
    currency: 'ARS'
  },
  // Información de contacto para confirmación
  contactPhone: process.env.CONTACT_PHONE || '+54 9 502-9031',
  contactWhatsApp: process.env.CONTACT_WHATSAPP || '+5495029031'
};

module.exports = bankConfig;
