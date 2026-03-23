import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY = 'MASUKKAN_API_KEY_GOOGLE_ANDA_DISINI';

interface Coordinate {
	latitude: number;
	longitude: number;
}

interface MenuItem {
	id: string;
	name: string;
	price: string;
	icon: keyof typeof Ionicons.glyphMap;
	imageUrl: string;
}

interface Cafe {
	id: string;
	title: string;
	description: string;
	address: string;
	rating: number;
	imageUrl: string;
	coordinate: Coordinate;
	menu: MenuItem[];
}

const mapStyle = [
	{ elementType: 'geometry', stylers: [{ color: '#1A1C23' }] },
	{ elementType: 'labels.text.fill', stylers: [{ color: '#8A8D96' }] },
	{ elementType: 'labels.text.stroke', stylers: [{ color: '#1A1C23' }] },
	{
		featureType: 'administrative.locality',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#E0E1E5' }],
	},
	{
		featureType: 'poi',
		elementType: 'labels',
		stylers: [{ visibility: 'off' }],
	},
	{
		featureType: 'road',
		elementType: 'geometry',
		stylers: [{ color: '#2B2E38' }],
	},
	{
		featureType: 'road',
		elementType: 'geometry.stroke',
		stylers: [{ color: '#21242D' }],
	},
	{
		featureType: 'road',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#8A8D96' }],
	},
	{
		featureType: 'water',
		elementType: 'geometry',
		stylers: [{ color: '#0F1115' }],
	},
	{
		featureType: 'water',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#515c6d' }],
	},
];

const calculateDistance = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): string => {
	const R = 6371;
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) *
			Math.cos(lat2 * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c;
	return distance.toFixed(1);
};

const dummyMenu: MenuItem[] = [
	{
		id: 'm1',
		name: 'Kopi Susu Aren',
		price: 'Rp 25.000',
		icon: 'cafe-outline',
		imageUrl:
			'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=200&q=80',
	},
	{
		id: 'm2',
		name: 'Americano',
		price: 'Rp 20.000',
		icon: 'cafe',
		imageUrl:
			'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=200&q=80',
	},
	{
		id: 'm3',
		name: 'Matcha Latte',
		price: 'Rp 28.000',
		icon: 'leaf-outline',
		imageUrl:
			'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?auto=format&fit=crop&w=200&q=80',
	},
	{
		id: 'm4',
		name: 'Croissant Butter',
		price: 'Rp 22.000',
		icon: 'fast-food-outline',
		imageUrl:
			'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?auto=format&fit=crop&w=200&q=80',
	},
	{
		id: 'm5',
		name: 'Cheese Cake',
		price: 'Rp 35.000',
		icon: 'pie-chart-outline',
		imageUrl:
			'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=200&q=80',
	},
];

interface GooglePlaceLocation {
	lat: number;
	lng: number;
}

interface GooglePlaceGeometry {
	location: GooglePlaceLocation;
}

interface GooglePlacePhoto {
	photo_reference: string;
}

interface GooglePlaceResult {
	place_id: string;
	name: string;
	vicinity: string;
	rating?: number;
	photos?: GooglePlacePhoto[];
	geometry: GooglePlaceGeometry;
}

export default function MapScreen() {
	const mapRef = useRef<MapView>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [hasLocationPermission, setHasLocationPermission] =
		useState<boolean>(false);
	const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
	const [cafeLocations, setCafeLocations] = useState<Cafe[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [modalVisible, setModalVisible] = useState<boolean>(false);
	const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
	const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

	const [region, setRegion] = useState<Region>({
		latitude: -6.21,
		longitude: 106.82,
		latitudeDelta: 0.05,
		longitudeDelta: 0.05,
	});

	const fetchNearbyCafes = async (
		lat: number,
		lng: number,
	): Promise<Cafe[]> => {
		if (GOOGLE_MAPS_API_KEY === 'MASUKKAN_API_KEY_GOOGLE_ANDA_DISINI') {
			return [
				{
					id: 'dummy-1',
					title: 'Kopi Kenangan Palmerah',
					description:
						'Kopi susu andalan dengan suasana cozy. Sangat cocok untuk bersantai dan WFC.',
					address: 'Stasiun Palmerah RT.1 RW.3',
					rating: 4.8,
					imageUrl:
						'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
					coordinate: {
						latitude: lat + 0.002,
						longitude: lng + 0.0015,
					},
					menu: dummyMenu,
				},
				{
					id: 'dummy-2',
					title: 'Fore Coffee Cideng',
					description:
						'Biji kopi pilihan yang diroasting langsung. Aroma kopi tercium hingga ke luar jalan raya.',
					address: 'Jl. Cideng Timur No. 59',
					rating: 4.7,
					imageUrl:
						'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80',
					coordinate: {
						latitude: lat - 0.0015,
						longitude: lng - 0.002,
					},
					menu: dummyMenu,
				},
				{
					id: 'dummy-3',
					title: 'Titik Temu Sarinah',
					description:
						'Fasilitas WiFi super cepat dan colokan listrik di setiap meja. Surga bagi pekerja lepas.',
					address: 'Gedung Sarinah Jalan M.H Thamrin',
					rating: 4.9,
					imageUrl:
						'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
					coordinate: {
						latitude: lat + 0.003,
						longitude: lng - 0.001,
					},
					menu: dummyMenu,
				},
				{
					id: 'dummy-4',
					title: 'Kopi Selamat Pagi',
					description:
						'Menikmati kopi dengan nuansa estetik minimalis. Cocok untuk foto-foto.',
					address: 'Jalan Mandala Utara no. 29C',
					rating: 4.8,
					imageUrl:
						'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=600&q=80',
					coordinate: {
						latitude: lat - 0.0025,
						longitude: lng + 0.003,
					},
					menu: dummyMenu,
				},
				{
					id: 'dummy-5',
					title: 'Anomali Coffee Kemang',
					description:
						'Roastery asli Indonesia dengan berbagai pilihan biji kopi nusantara.',
					address: 'Jl. Kemang Raya No.72',
					rating: 4.9,
					imageUrl:
						'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=600&q=80',
					coordinate: {
						latitude: lat + 0.001,
						longitude: lng - 0.0035,
					},
					menu: dummyMenu,
				},
			];
		}

		try {
			const radius = 2000;
			const type = 'cafe';
			const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

			const response = await fetch(url);
			const data = await response.json();

			if (data.results) {
				return data.results.map((place: GooglePlaceResult) => ({
					id: place.place_id,
					title: place.name,
					description: `Kafe terdekat di ${place.vicinity}`,
					address: place.vicinity,
					rating: place.rating || 0,
					imageUrl:
						place.photos && place.photos.length > 0
							? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
							: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
					coordinate: {
						latitude: place.geometry.location.lat,
						longitude: place.geometry.location.lng,
					},
					menu: dummyMenu,
				}));
			}
			return [];
		} catch {
			return [];
		}
	};

	useEffect(() => {
		let isMounted = true;

		(async () => {
			const { status } =
				await Location.requestForegroundPermissionsAsync();

			if (!isMounted) return;

			if (status === 'granted') {
				setHasLocationPermission(true);
				const location = await Location.getCurrentPositionAsync({});
				const { latitude, longitude } = location.coords;

				if (!isMounted) return;

				setUserLocation({ latitude, longitude });

				const initialRegion = {
					latitude,
					longitude,
					latitudeDelta: 0.015,
					longitudeDelta: 0.015,
				};

				setRegion(initialRegion);

				const nearbyCafes = await fetchNearbyCafes(latitude, longitude);
				if (!isMounted) return;

				setCafeLocations(nearbyCafes);
				setIsLoading(false);
			} else {
				if (!isMounted) return;
				setIsLoading(false);
				Alert.alert(
					'Izin Lokasi Ditolak',
					'Aplikasi tidak dapat menampilkan lokasi Anda di peta tanpa izin.',
				);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, []);

	const openRouteInMaps = (lat: number, lng: number, label: string) => {
		const scheme = Platform.select({
			ios: 'maps:0,0?q=',
			android: 'geo:0,0?q=',
		});
		const latLng = `${lat},${lng}`;
		const url = Platform.select({
			ios: `${scheme}${label}@${latLng}`,
			android: `${scheme}${latLng}(${label})`,
		});

		if (url) {
			Linking.openURL(url).catch(() =>
				Alert.alert('Error', 'Tidak dapat membuka aplikasi peta.'),
			);
		}
	};

	const handleMarkerPress = (cafe: Cafe) => {
		setActiveMarkerId(cafe.id);
		setSelectedCafe(cafe);
		setModalVisible(true);
		if (mapRef.current) {
			mapRef.current.animateToRegion(
				{
					latitude: cafe.coordinate.latitude - 0.005,
					longitude: cafe.coordinate.longitude,
					latitudeDelta: 0.015,
					longitudeDelta: 0.015,
				},
				500,
			);
		}
	};

	const recenterMap = () => {
		if (userLocation && mapRef.current) {
			mapRef.current.animateToRegion(
				{
					latitude: userLocation.latitude,
					longitude: userLocation.longitude,
					latitudeDelta: 0.015,
					longitudeDelta: 0.015,
				},
				1000,
			);
		}
	};

	const handleModalClose = () => {
		setModalVisible(false);
		setActiveMarkerId(null);
	};

	const filteredCafes = cafeLocations.filter((cafe) =>
		cafe.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#00D2FF' />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.topContainer}>
				<View style={styles.searchBarContainer}>
					<Ionicons
						name='search'
						size={20}
						color='#8A8D96'
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder='Cari kafe, resto, atau cakes...'
						placeholderTextColor='#8A8D96'
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity onPress={() => setSearchQuery('')}>
							<Ionicons
								name='close-circle'
								size={20}
								color='#8A8D96'
							/>
						</TouchableOpacity>
					)}
				</View>

				{userLocation && (
					<View style={styles.locationBadgeContainer}>
						<View style={styles.locationBadge}>
							<Ionicons
								name='navigate-circle'
								size={16}
								color='#00D2FF'
							/>
							<ThemedText style={styles.locationBadgeText}>
								Lokasi Saat Ini Aktif (
								{userLocation.latitude.toFixed(4)},{' '}
								{userLocation.longitude.toFixed(4)})
							</ThemedText>
						</View>
					</View>
				)}
			</View>

			<MapView
				ref={mapRef}
				provider={PROVIDER_GOOGLE}
				style={styles.map}
				initialRegion={region}
				showsUserLocation={hasLocationPermission}
				showsPointsOfInterest={false}
				showsMyLocationButton={false}
				showsCompass={false}
				customMapStyle={mapStyle}>
				{userLocation && (
					<Circle
						center={userLocation}
						radius={600}
						fillColor='rgba(255, 255, 255, 0.08)'
						strokeColor='rgba(255, 255, 255, 0.3)'
						strokeWidth={1}
					/>
				)}

				{filteredCafes.map((cafe) => {
					const isActive = cafe.id === activeMarkerId;

					return (
						<Marker
							key={cafe.id}
							coordinate={cafe.coordinate}
							style={{ zIndex: isActive ? 999 : 1 }}
							onPress={() => handleMarkerPress(cafe)}>
							<View style={styles.markerContainer}>
								{isActive ? (
									<View style={styles.activeMarkerWrap}>
										<View style={styles.activeMarkerCore}>
											<Image
												source={{ uri: cafe.imageUrl }}
												style={styles.activeMarkerImage}
											/>
											<View
												style={styles.activeMarkerInfo}>
												<ThemedText
													style={
														styles.activeMarkerTitle
													}
													numberOfLines={1}>
													{cafe.title}
												</ThemedText>
												<View
													style={
														styles.activeMarkerRatingRow
													}>
													<Ionicons
														name='star'
														size={10}
														color='#FFD700'
													/>
													<ThemedText
														style={
															styles.activeMarkerRatingText
														}>
														{cafe.rating}
													</ThemedText>
												</View>
											</View>
										</View>
										<View
											style={styles.activeMarkerPointer}
										/>
									</View>
								) : (
									<View style={styles.inactiveMarkerWrap}>
										<View style={styles.inactiveBadge}>
											<Ionicons
												name='star'
												size={8}
												color='#1A1C23'
											/>
											<ThemedText
												style={
													styles.inactiveBadgeText
												}>
												{cafe.rating}
											</ThemedText>
										</View>
										<View style={styles.inactiveMarkerCore}>
											<Ionicons
												name='cafe'
												size={16}
												color='#00D2FF'
											/>
										</View>
										<View
											style={styles.inactiveMarkerPointer}
										/>
									</View>
								)}
							</View>
						</Marker>
					);
				})}
			</MapView>

			<TouchableOpacity
				style={styles.recenterButton}
				onPress={recenterMap}>
				<Ionicons name='locate' size={22} color='#FFF' />
			</TouchableOpacity>

			<Modal
				animationType='slide'
				transparent={true}
				visible={modalVisible}
				onRequestClose={handleModalClose}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						{selectedCafe && (
							<ScrollView
								showsVerticalScrollIndicator={false}
								bounces={false}>
								<View style={styles.imageContainer}>
									<Image
										source={{ uri: selectedCafe.imageUrl }}
										style={styles.cafeImage}
									/>
									<TouchableOpacity
										style={styles.closeIcon}
										onPress={handleModalClose}>
										<Ionicons
											name='close'
											size={24}
											color='#FFF'
										/>
									</TouchableOpacity>
								</View>

								<View style={styles.modalBody}>
									<View style={styles.modalHeader}>
										<View style={styles.titleWrapper}>
											<ThemedText
												type='title'
												style={styles.modalTitle}>
												{selectedCafe.title}
											</ThemedText>
											{userLocation && (
												<View
													style={
														styles.distanceBadge
													}>
													<Ionicons
														name='location'
														size={12}
														color='#00D2FF'
													/>
													<ThemedText
														style={
															styles.distanceText
														}>
														{calculateDistance(
															userLocation.latitude,
															userLocation.longitude,
															selectedCafe
																.coordinate
																.latitude,
															selectedCafe
																.coordinate
																.longitude,
														)}{' '}
														km dari Anda
													</ThemedText>
												</View>
											)}
										</View>
										<View style={styles.ratingBadge}>
											<Ionicons
												name='star'
												size={14}
												color='#1A1C23'
											/>
											<ThemedText
												style={styles.modalRatingText}>
												{selectedCafe.rating}
											</ThemedText>
										</View>
									</View>

									<ThemedText style={styles.modalAddress}>
										<Ionicons
											name='map-outline'
											size={14}
											color='#8A8D96'
										/>{' '}
										{selectedCafe.address}
									</ThemedText>

									<ThemedText style={styles.modalDescription}>
										{selectedCafe.description}
									</ThemedText>

									<View style={styles.divider} />

									<ThemedText
										type='subtitle'
										style={styles.menuTitle}>
										<Ionicons
											name='restaurant-outline'
											size={18}
											color='#FFF'
										/>{' '}
										Menu Spesial
									</ThemedText>

									<View style={styles.menuList}>
										{selectedCafe.menu.map((item) => (
											<View
												key={item.id}
												style={styles.menuItem}>
												<View
													style={styles.menuItemLeft}>
													<Image
														source={{
															uri: item.imageUrl,
														}}
														style={
															styles.menuItemImage
														}
													/>
													<View
														style={
															styles.menuItemInfo
														}>
														<ThemedText
															style={
																styles.menuItemName
															}>
															{item.name}
														</ThemedText>
														<ThemedText
															style={
																styles.menuItemPrice
															}>
															{item.price}
														</ThemedText>
													</View>
												</View>
												<View
													style={
														styles.menuIconContainer
													}>
													<Ionicons
														name={item.icon}
														size={18}
														color='#00D2FF'
													/>
												</View>
											</View>
										))}
									</View>

									<TouchableOpacity
										style={styles.routeButton}
										onPress={() =>
											openRouteInMaps(
												selectedCafe.coordinate
													.latitude,
												selectedCafe.coordinate
													.longitude,
												selectedCafe.title,
											)
										}>
										<Ionicons
											name='navigate'
											size={18}
											color='#1A1C23'
										/>
										<ThemedText style={styles.buttonText}>
											Arahkan Navigasi
										</ThemedText>
									</TouchableOpacity>
								</View>
							</ScrollView>
						)}
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1A1C23',
	},
	container: {
		flex: 1,
		backgroundColor: '#1A1C23',
	},
	map: {
		width: width,
		height: height,
	},
	topContainer: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 60 : 40,
		width: '100%',
		zIndex: 10,
		paddingHorizontal: 16,
		gap: 12,
	},
	searchBarContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(26, 28, 35, 0.95)',
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	searchIcon: {
		marginRight: 10,
	},
	searchInput: {
		flex: 1,
		color: '#FFF',
		fontSize: 16,
		fontWeight: '500',
	},
	locationBadgeContainer: {
		alignItems: 'center',
	},
	locationBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 210, 255, 0.15)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: 'rgba(0, 210, 255, 0.3)',
		gap: 6,
	},
	locationBadgeText: {
		color: '#00D2FF',
		fontSize: 12,
		fontWeight: '600',
	},
	markerContainer: {
		alignItems: 'center',
		justifyContent: 'flex-end',
		padding: 4,
	},
	inactiveMarkerWrap: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	inactiveBadge: {
		position: 'absolute',
		top: -8,
		right: -10,
		backgroundColor: '#FFD700',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderRadius: 8,
		zIndex: 2,
		borderWidth: 1,
		borderColor: '#1A1C23',
	},
	inactiveBadgeText: {
		fontSize: 9,
		fontWeight: 'bold',
		color: '#1A1C23',
		marginLeft: 2,
	},
	inactiveMarkerCore: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#2A2D3A',
		borderWidth: 2,
		borderColor: '#00D2FF',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#00D2FF',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 6,
	},
	inactiveMarkerPointer: {
		width: 0,
		height: 0,
		backgroundColor: 'transparent',
		borderStyle: 'solid',
		borderLeftWidth: 6,
		borderRightWidth: 6,
		borderTopWidth: 8,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#00D2FF',
		marginTop: -1,
	},
	activeMarkerWrap: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	activeMarkerCore: {
		flexDirection: 'row',
		backgroundColor: '#FFF',
		borderRadius: 24,
		padding: 4,
		paddingRight: 12,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 10,
	},
	activeMarkerImage: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	activeMarkerInfo: {
		marginLeft: 8,
		justifyContent: 'center',
	},
	activeMarkerTitle: {
		fontSize: 13,
		fontWeight: 'bold',
		color: '#1A1C23',
		maxWidth: 100,
	},
	activeMarkerRatingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
	},
	activeMarkerRatingText: {
		fontSize: 11,
		fontWeight: '700',
		color: '#FFD700',
		marginLeft: 4,
	},
	activeMarkerPointer: {
		width: 0,
		height: 0,
		backgroundColor: 'transparent',
		borderStyle: 'solid',
		borderLeftWidth: 8,
		borderRightWidth: 8,
		borderTopWidth: 10,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#FFF',
		marginTop: -2,
	},
	recenterButton: {
		position: 'absolute',
		bottom: 40,
		right: 20,
		backgroundColor: 'rgba(42, 45, 58, 0.9)',
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
		zIndex: 10,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0,0,0,0.6)',
	},
	modalContent: {
		backgroundColor: '#1A1C23',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		height: height * 0.85,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 20,
	},
	imageContainer: {
		width: '100%',
		height: 220,
		position: 'relative',
	},
	cafeImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	closeIcon: {
		position: 'absolute',
		top: 20,
		right: 20,
		backgroundColor: 'rgba(26, 28, 35, 0.7)',
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalBody: {
		padding: 24,
		paddingBottom: 40,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	titleWrapper: {
		flex: 1,
		marginRight: 16,
	},
	modalTitle: {
		fontSize: 24,
		color: '#FFF',
		marginBottom: 8,
		fontWeight: 'bold',
	},
	distanceBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 210, 255, 0.1)',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
		alignSelf: 'flex-start',
		gap: 6,
	},
	distanceText: {
		fontSize: 13,
		color: '#00D2FF',
		fontWeight: '700',
	},
	ratingBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFD700',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		gap: 6,
	},
	modalRatingText: {
		fontWeight: 'bold',
		color: '#1A1C23',
		fontSize: 15,
	},
	modalAddress: {
		fontSize: 14,
		color: '#8A8D96',
		marginBottom: 16,
		lineHeight: 20,
	},
	modalDescription: {
		fontSize: 15,
		color: '#E0E1E5',
		lineHeight: 24,
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginVertical: 24,
	},
	menuTitle: {
		fontSize: 18,
		color: '#FFF',
		fontWeight: 'bold',
		marginBottom: 16,
	},
	menuList: {
		marginBottom: 32,
		gap: 12,
	},
	menuItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#2A2D3A',
		padding: 12,
		borderRadius: 16,
	},
	menuItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	menuItemImage: {
		width: 50,
		height: 50,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	menuItemInfo: {
		justifyContent: 'center',
		gap: 4,
	},
	menuIconContainer: {
		backgroundColor: 'rgba(0, 210, 255, 0.1)',
		padding: 10,
		borderRadius: 12,
	},
	menuItemName: {
		fontSize: 15,
		color: '#FFF',
		fontWeight: '600',
	},
	menuItemPrice: {
		fontSize: 14,
		color: '#00D2FF',
		fontWeight: 'bold',
	},
	routeButton: {
		flexDirection: 'row',
		backgroundColor: '#00D2FF',
		paddingVertical: 16,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 10,
		shadowColor: '#00D2FF',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 6,
	},
	buttonText: {
		color: '#1A1C23',
		fontWeight: 'bold',
		fontSize: 16,
		letterSpacing: 0.5,
	},
});
