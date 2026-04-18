import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - Z Agro Tech` : 'Z Agro Tech';

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
