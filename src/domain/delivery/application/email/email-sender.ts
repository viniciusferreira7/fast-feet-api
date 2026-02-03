export abstract class EmailSender {
  abstract send(title: string, content: string, to: string): Promise<boolean>;
}
