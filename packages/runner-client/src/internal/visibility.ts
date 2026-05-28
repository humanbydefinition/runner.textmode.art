export interface PageVisibilityApi {
	getState: () => string;
	addChangeListener: (listener: () => void) => () => void;
}

export function isPageVisible(visibility: PageVisibilityApi): boolean {
	return visibility.getState() === 'visible';
}

export function createDocumentVisibilityApi(): PageVisibilityApi {
	const listeners = new Set<() => void>();
	let forcedHidden = false;

	const notify = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	const getState = () => {
		if (forcedHidden) return 'hidden';
		const documentState = getDocument()?.visibilityState;
		return typeof documentState === 'string' ? documentState : 'visible';
	};

	const addChangeListener = (listener: () => void) => {
		listeners.add(listener);

		if (listeners.size === 1) {
			attachGlobalListeners();
		}

		return () => {
			listeners.delete(listener);
			if (listeners.size === 0) {
				detachGlobalListeners();
			}
		};
	};

	const handleVisibilityChange = () => {
		notify();
	};

	const handlePageHide = () => {
		forcedHidden = true;
		notify();
	};

	const handlePageShow = () => {
		forcedHidden = false;
		notify();
	};

	const attachGlobalListeners = () => {
		getDocument()?.addEventListener?.('visibilitychange', handleVisibilityChange);
		getDocument()?.addEventListener?.('freeze', handlePageHide);
		getDocument()?.addEventListener?.('resume', handlePageShow);
		getWindow()?.addEventListener?.('pagehide', handlePageHide);
		getWindow()?.addEventListener?.('pageshow', handlePageShow);
	};

	const detachGlobalListeners = () => {
		getDocument()?.removeEventListener?.('visibilitychange', handleVisibilityChange);
		getDocument()?.removeEventListener?.('freeze', handlePageHide);
		getDocument()?.removeEventListener?.('resume', handlePageShow);
		getWindow()?.removeEventListener?.('pagehide', handlePageHide);
		getWindow()?.removeEventListener?.('pageshow', handlePageShow);
	};

	return {
		getState,
		addChangeListener,
	};
}

function getDocument(): Document | null {
	return typeof document === 'undefined' ? null : document;
}

function getWindow(): Window | null {
	return typeof window === 'undefined' ? null : window;
}
