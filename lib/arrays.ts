export const partitionBy = <T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] => {
  return array.reduce(
    (acc, item) => {
      if (predicate(item)) {
        acc[0].push(item)
      } else {
        acc[1].push(item)
      }
      return acc
    },
    [[], []] as [T[], T[]]
  )
}
