export class UpdateImageMediaCommand {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly altDescription: string,
    public readonly url: string
  ) {}
}
