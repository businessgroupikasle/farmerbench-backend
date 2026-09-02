const fs = require('fs');
const path = require('path');

const dashPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/DashboardPage.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

const targetStart = 'export const DashboardPage: React.FC = () => {';
const splitMarker = "const tab = searchParams.get('tab');";

const replacementHeader = `export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auth & Profile
  const { user, isAuthenticated, updateProfile, changePassword, logout } = useAuth();
  const { data: rawOrders = [], isLoading: isOrdersLoading } = useOrders();
  const { items: wishlistItems, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCart();
  const { addToast } = useUIStore();

  const orders = (rawOrders || []).filter((o: any) => {
    if (o.paymentMethod === 'RAZORPAY' && o.paymentStatus !== 'PAID') return false;
    if (o.orderStatus === 'CANCELLED') return false;
    return true;
  });

  // Active View Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<string>('');

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileLocation, setProfileLocation] = useState(user?.location || '');
  const [profileCrops, setProfileCrops] = useState(user?.crops || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    `;

const idxStart = dashContent.indexOf(targetStart);
const idxMarker = dashContent.indexOf(splitMarker);

if (idxStart !== -1 && idxMarker !== -1) {
  dashContent = dashContent.substring(0, idxStart) + replacementHeader + dashContent.substring(idxMarker);
  fs.writeFileSync(dashPath, dashContent, 'utf8');
  console.log('Successfully fixed DashboardPage.tsx');
} else {
  console.error('Could not find indices:', { idxStart, idxMarker });
}
