import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";
import ContactZPRO from "./ContactZPRO";

@Table
export default class ContactCustomField extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  name!: string;

  @Column
  value!: string;

  @ForeignKey(() => ContactZPRO)
  @Column
  contactId!: number;

  @BelongsTo(() => ContactZPRO)
  contact!: ContactZPRO;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 