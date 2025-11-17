import { useState, useEffect, type ReactNode } from "react";

interface ClientOnlyProps {
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * ClientOnly - Prevents server-side rendering of children
 * Only renders children after component mounts on client
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (!hasMounted) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
