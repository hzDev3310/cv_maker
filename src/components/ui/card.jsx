import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  style,
  ...props
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-surface text-sm text-on-surface ring-1 ring-outline-variant",
        size === "default" ? "gap-4 py-4" : "gap-3 py-3",
        className
      )}
      style={style}
      {...props} />
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 rounded-t-xl",
        "px-4 has-[[data-slot=card-action]]:grid-cols-[1fr_auto]",
        "has-[[data-slot=card-description]]:grid-rows-[auto_auto]",
        "[&:where([class*=border-b])]:pb-4",
        className
      )}
      {...props} />
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-snug font-medium text-on-surface",
        "data-[size=sm]:text-sm",
        className
      )}
      {...props} />
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-on-surface-variant", className)}
      {...props} />
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />
  );
}

function CardContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4", className)}
      {...props} />
  );
}

function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t border-outline-variant bg-surface-container-low p-4",
        className
      )}
      {...props} />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
