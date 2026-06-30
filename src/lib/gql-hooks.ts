import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query"

/** Wrap a gqlkit builder .execute() call in useQuery */
export function useGqlQuery<TData, TError = unknown>(
	queryKey: unknown[],
	queryFn: () => Promise<TData>,
	options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
	return useQuery<TData, TError>({
		queryKey,
		queryFn,
		...options,
	})
}

/** Wrap a gqlkit mutation builder in useMutation */
export function useGqlMutation<
	TData,
	TVariables,
	TError = unknown,
	TContext = unknown,
>(
	mutationKey: string[],
	mutationFn: (variables: TVariables) => Promise<TData>,
	options?: Omit<
		UseMutationOptions<TData, TError, TVariables, TContext>,
		"mutationKey" | "mutationFn"
	>,
) {
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey,
		mutationFn,
		...options,
	})
}
