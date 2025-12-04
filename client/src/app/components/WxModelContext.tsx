import { getWxModels } from '@utils/getFunctions/getModels';
import {
  createContext,
  MutableRefObject,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/*
 * Context saving WatsonX available model list to define the endpoints between RITS / WatsonX
 */

type WxModelContextProps = {
  wxModels: MutableRefObject<string[]>;
  isWxModel: (modelName: string) => boolean;
  loading: boolean;
};

const WxModelContext = createContext<WxModelContextProps>({
  wxModels: { current: [] },
  isWxModel: (_modelName: string) => false,
  loading: false,
});

export const useWxModelContext = () => useContext(WxModelContext);

const WxModelContextProvider = ({ children }: { children: ReactElement }) => {
  const wxModels = useRef<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const isWxModel = useCallback(
    (modelName: string) => {
      const list = wxModels.current;

      if (!list) return false;
      const modelNameFormatted = modelName.split('/').pop()?.replaceAll('.', '-');

      return list.map((d) => d.split('/').pop()).includes(modelNameFormatted);
    },
    [wxModels],
  );

  useEffect(() => {
    setLoading(true);
    //list WX available models to define the endpoint
    getWxModels()
      .then((models) => {
        wxModels.current = [...models];
      })
      .finally(() => setLoading(false));
  }, []);

  return <WxModelContext.Provider value={{ wxModels, isWxModel, loading }}>{children}</WxModelContext.Provider>;
};

export default WxModelContextProvider;
