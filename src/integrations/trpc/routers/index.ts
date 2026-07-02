import { createTRPCRouter } from "../init"
import { postsRouter } from "./posts"
import { todosRouter } from "./todos"

export const trpcRouter = createTRPCRouter({
	todos: todosRouter,
	posts: postsRouter,
})

export type TRPCRouter = typeof trpcRouter
