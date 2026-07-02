import { postsRouter } from "./posts"
import { todosRouter } from "./todos"

export const orpcRouter = {
	todos: todosRouter,
	posts: postsRouter,
}
