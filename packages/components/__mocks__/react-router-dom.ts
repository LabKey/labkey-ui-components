const rrd = jest.createMockFromModule('react-router-dom') as any;
export default rrd;

export const Link = rrd.Link;
export const unstable_usePrompt = () => {};

let navigate = jest.fn();

export const __setNavigate = (mockNavigate): void => {
    navigate = mockNavigate;
};
export const useNavigate = () => navigate;

// Yes, this doesn't properly match the Location type, however we don't use anything but pathname at the moment
let location_ = { pathname: '' } as Location;

export const __setLocation = (mockLocation: Location): void => {
    location_ = mockLocation;
};
export const useLocation = () => location_;

let searchParams = new URLSearchParams();
let setSearchParams = jest.fn();
export const __setSearchParams = (mockSearchParams: URLSearchParams) => searchParams = mockSearchParams;
export const __setSetSearchParams = (mockSetSearchParams) => setSearchParams = mockSetSearchParams;
export const useSearchParams = () => {
    return [searchParams, setSearchParams];
};

let params = {};
export const __setParams = (mockParams: Record<string, string>) => params = mockParams;
export const useParams = () => params;
