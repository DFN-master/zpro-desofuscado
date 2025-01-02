interface ContactTestParams {
  contactNumber: string | null | undefined;
  tenant: {
    substr(arg0: number): string;
  } | null;
  channel: string;
}

const IsContactTest = async ({
  contactNumber,
  tenant,
  channel
}: ContactTestParams): Promise<boolean> => {
  // Verifica se o canal não é whatsapp nem baileys
  if (channel !== "whatsapp" && channel !== "baileys") {
    return false;
  }

  // Verifica se existe tenant e se o número de contato não está associado ao tenant
  if (
    tenant && 
    (contactNumber === null || 
     contactNumber === undefined || 
     contactNumber.indexOf(tenant.substr(0)) === -1) || 
    !contactNumber
  ) {
    return true;
  }

  return false;
};

export default IsContactTest; 