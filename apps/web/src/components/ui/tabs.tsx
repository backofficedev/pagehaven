import { Content, List, Root, Trigger } from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef, ComponentRef, RefObject } from "react";

import { cn } from "@/lib/utils";

const Tabs = Root;

const TabsList = ({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof List> & {
  ref?: RefObject<ComponentRef<typeof List> | null>;
}) => (
  <List
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    ref={ref}
    {...props}
  />
);
TabsList.displayName = List.displayName;

const TabsTrigger = ({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof Trigger> & {
  ref?: RefObject<ComponentRef<typeof Trigger> | null>;
}) => (
  <Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    ref={ref}
    {...props}
  />
);
TabsTrigger.displayName = Trigger.displayName;

const TabsContent = ({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof Content> & {
  ref?: RefObject<ComponentRef<typeof Content> | null>;
}) => (
  <Content
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    ref={ref}
    {...props}
  />
);
TabsContent.displayName = Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
