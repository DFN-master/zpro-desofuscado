import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  BelongsTo,
  ForeignKey,
  DataType,
  UpdatedAt
} from "sequelize-typescript";

import TicketZPRO from "./TicketZPRO";
import TenantZPRO from "./TenantZPRO"; 
import WhatsappZPRO from "./WhatsappZPRO";

@Table
export default class MessageUpsert extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column(DataType.STRING)
  remoteJid!: string;

  @Column(DataType.STRING)
  dataJson!: string;

  @Column(DataType.TEXT)
  body!: string;

  @Column(DataType.STRING)
  mediaUrl!: object;

  @Column
  mediaType!: string;

  @Default(false)
  @Column
  isDeleted!: boolean;

  @Column(DataType.DATE(6))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(6))
  updatedAt!: Date;

  @ForeignKey(() => TicketZPRO)
  @Column
  ticketId!: number;

  @BelongsTo(() => TicketZPRO)
  ticket!: TicketZPRO;

  @ForeignKey(() => TenantZPRO)
  @Column
  tenantId!: number;

  @BelongsTo(() => TenantZPRO)
  tenant!: TenantZPRO;

  @Column
  wid!: string;

  @Default(false)
  @Column
  fromMe!: boolean;

  @Default(false)
  @Column
  isForwarded!: boolean;

  @ForeignKey(() => WhatsappZPRO)
  @Column
  whatsappId!: number;

  @BelongsTo(() => WhatsappZPRO)
  whatsapp!: WhatsappZPRO;

  @Column
  imported!: boolean;

  @Column
  ignore!: boolean;

  @Column
  isEdited!: boolean;
} 