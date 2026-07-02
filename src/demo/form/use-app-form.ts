import { createFormHook } from "@tanstack/react-form"
import { fieldContext, formContext } from "./form-context"
import { Select, SubscribeButton, TextArea, TextField } from "./form-fields"

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		Select,
		TextArea,
	},
	formComponents: {
		SubscribeButton,
	},
	fieldContext,
	formContext,
})
