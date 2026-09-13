import { ContainerBindings } from '@adonisjs/core/types'

export type CommandConstructor<C, R> = new (...args: any[]) => {
  handle: (command: C) => Promise<R>
}
export type QueryConstructor<Q, R> = new (...args: any[]) => { handle: (query: Q) => Promise<R> }

export type Handler<T, R> = {
  handler: CommandConstructor<T, R> | QueryConstructor<T, R>
  deps: Array<keyof ContainerBindings>
}
