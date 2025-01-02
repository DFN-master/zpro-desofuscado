'use strict';

import { getIO } from '../libs/socketZPRO';

interface EmitEventParams {
  tenantId: string | number;
  type: string;
  payload: any;
}

interface EmitData {
  type: string;
  payload: any;
}

const emitEvent = ({ tenantId, type, payload }: EmitEventParams): void => {
  const io = getIO();
  let room = `${tenantId}:ticketList`;

  if (type.indexOf('contact:') !== -1) {
    room = `${tenantId}:contactList`;
  }

  const data: EmitData = {
    type,
    payload
  };

  io.to(tenantId.toString()).emit(room, data);
};

export { emitEvent }; 