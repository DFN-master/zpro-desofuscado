import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType
} from "sequelize-typescript";
import { format } from "date-fns";
import Contact from "./ContactZPRO";
import Message from "./MessageZPRO";
import User from "./UserZPRO";
import Whatsapp from "./WhatsappZPRO";
import AutoReply from "./AutoReplyZPRO";
import StepsReply from "./StepsReplyZPRO";
import Queue from "./QueueZPRO";
import Tenant from "./TenantZPRO";
import MessageOffLine from "./MessageOffLineZPRO";
import ChatFlow from "./ChatFlowZPRO";

@Table
class Ticket extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    defaultValue: "pending"
  })
  status: string;

  @Column
  unreadMessages: number;

  @Column
  lastMessage: string;

  @Default(true)
  @Column
  isGroup: boolean;

  @Default(false)
  @Column
  answered: boolean;

  @Default(false)
  @Column
  isCreatedByApi: boolean;

  @Default(false)
  @Column
  isTransferScheduled: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column(DataType.DATE)
  startedAttendanceAt: Date;

  @Column(DataType.VIRTUAL)
  get protocol(): string {
    const createdAt = this.getDataValue("createdAt");
    const formattedDate = format(new Date(createdAt), "yyyyddMMHHmmss");
    const id = this.getDataValue("id");
    return `${formattedDate}${id}`;
  }

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @HasMany(() => Message)
  messages: Message[];

  @ForeignKey(() => AutoReply)
  @Column
  autoReplyId: number;

  @BelongsTo(() => AutoReply)
  autoReply: AutoReply;

  @ForeignKey(() => StepsReply)
  @Column
  stepAutoReplyId: number;

  @BelongsTo(() => StepsReply)
  stepsReply: StepsReply;

  @ForeignKey(() => ChatFlow)
  @Column
  chatFlowId: number;

  @BelongsTo(() => ChatFlow)
  chatFlow: ChatFlow;

  @Default(null)
  @AllowNull
  @Column(DataType.INTEGER)
  stepChatFlow: number;

  @ForeignKey(() => Queue)
  @Default(null)
  @AllowNull
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @Default(null)
  @Column(DataType.JSONB)
  apiConfig: object;

  @Default(null)
  @Column(DataType.JSONB)
  chatGptHistory: object;

  @Default([])
  @Column(DataType.JSONB)
  chatGptHistoryTries: any[];

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @HasMany(() => MessageOffLine)
  messagesOffLine: MessageOffLine[];

  @Default(null)
  @AllowNull
  @Column(DataType.JSONB)
  apiConfig: object;

  @Column({
    defaultValue: false,
    type: DataType.BOOLEAN
  })
  isActiveDemand: boolean;

  @Column({
    defaultValue: null,
    type: DataType.TEXT
  })
  lastInteractionBot: object;

  @Column({
    defaultValue: false,
    type: DataType.BOOLEAN
  })
  chatgptOff: boolean;

  @Column({
    defaultValue: false,
    type: DataType.BOOLEAN
  })
  dialogflowOff: boolean;

  @Column({
    defaultValue: null,
    type: DataType.TEXT
  })
  chatgptPrompt: object;

  @Column({
    defaultValue: false,
    type: DataType.BOOLEAN
  })
  imported: boolean;

  @Column(DataType.JSONB)
  typebotHistory: object;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotStatus: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotSessionId: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotName: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotUrl: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotOff: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotResponse: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotModifyKey: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotModifyUrl: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotModifyStatus: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  typebotModifySessionId: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  threadId: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  assistantId: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  runId: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  chatgptStatus: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  chatgptApiKey: string;

  @Default(null)
  @AllowNull
  @Column(DataType.STRING)
  chatgptOrganizationId: string;

  @Column
  closedAt: Date;

  @Column({
    defaultValue: false,
    type: DataType.BOOLEAN
  })
  isFarewell: string;

  @Column(DataType.JSONB)
  channel: string;
}

export default Ticket; 