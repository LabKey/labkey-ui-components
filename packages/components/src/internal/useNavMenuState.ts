import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

interface ProductMenuState {
    menuRef: MutableRefObject<HTMLDivElement>;
    setShow: Dispatch<SetStateAction<boolean>>;
    show: boolean;
    toggleRef: MutableRefObject<HTMLButtonElement>;
}

/**
 * Hook used to manage state and refs for our various navigation menus (ProductMenu, ProductNavigationMenu,
 * ServerNotifications)
 */
export function useNavMenuState(): ProductMenuState {
    const [show, setShow] = useState<boolean>(false);
    const toggleRef = useRef<HTMLButtonElement>();
    const menuRef = useRef<HTMLDivElement>();
    const onDocumentClick = useCallback(event => {
        // Don't take action if we're clicking the toggle, as that handles open/close on its own, and we can't use
        // preventDocumentHandler in the toggle onClick, or we'll keep the menu open if the user clicks another menu.
        if (event.target === toggleRef.current) return;

        // Don't take action if we've clicked anything inside the menu. We have to be defensive about the existence of
        // menuRef because of how React handles events, our onClick handler above will get called before this document
        // handler, so menuRef.current may be null.
        if (!menuRef.current?.contains(event.target)) setShow(false);
    }, []);
    useEffect(() => {
        // We only want to listen for clicks on the document if the menu is open
        if (show) {
            document.addEventListener('click', onDocumentClick);
        }

        // Prevent scrolling the body when a navigation menu is shown
        document.body.classList.toggle('no-scroll', show);

        return () => {
            document.removeEventListener('click', onDocumentClick);
        };
    }, [show, onDocumentClick]);

    return {
        show,
        setShow,
        toggleRef,
        menuRef,
    };
}
