import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  Default
} from "sequelize-typescript";
import WhatsappZPRO from "./WhatsappZPRO";

@Table
export default class Baileys extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Default(null)
  @Column
  contacts!: string;

  @Default(null) 
  @Column
  chats!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @ForeignKey(() => WhatsappZPRO)
  @Column
  whatsappId!: number;
} 