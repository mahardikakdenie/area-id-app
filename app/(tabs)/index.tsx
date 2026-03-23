import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_MARGIN = 10;
const SPACING_FOR_CARD_INSET = width * 0.075 - CARD_MARGIN;

interface Coordinate {
	latitude: number;
	longitude: number;
}

interface Cafe {
	id: string;
	title: string;
	description: string;
	address: string;
	rating: number;
	imageUrl: string;
	coordinate: Coordinate;
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

export default function MapScreen() {
	const mapRef = useRef<MapView>(null);
	const flatListRef = useRef<FlatList<Cafe>>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [hasLocationPermission, setHasLocationPermission] =
		useState<boolean>(false);
	const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
	const [cafeLocations, setCafeLocations] = useState<Cafe[]>([]);
	const [activeCafeId, setActiveCafeId] = useState<string>('');

	const [region, setRegion] = useState<Region>({
		latitude: -6.21,
		longitude: 106.82,
		latitudeDelta: 0.05,
		longitudeDelta: 0.05,
	});

	useEffect(() => {
		(async () => {
			const { status } =
				await Location.requestForegroundPermissionsAsync();
			if (status === 'granted') {
				setHasLocationPermission(true);
				const location = await Location.getCurrentPositionAsync({});
				const { latitude, longitude } = location.coords;

				setUserLocation({ latitude, longitude });

				const initialRegion = {
					latitude,
					longitude,
					latitudeDelta: 0.015,
					longitudeDelta: 0.015,
				};

				setRegion(initialRegion);

				const realCsvData: Cafe[] = [
					{
						id: 'csv-1',
						title: 'Kopi Kenangan Stasiun Palmerah',
						description:
							'Badan Usaha: PT Bumi Berkah Boga. Tanah Abang, Jakarta Pusat.',
						address: 'Stasiun Palmerah RT.1 RW.3',
						rating: 4.8,
						imageUrl:
							'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
						coordinate: {
							latitude: latitude + 0.002,
							longitude: longitude + 0.0015,
						},
					},
					{
						id: 'csv-2',
						title: 'Fore Coffee Cideng',
						description:
							'Badan Usaha: PT Fore Kopi Indonesia. Gambir, Jakarta Pusat.',
						address: 'Jl. Cideng Timur No. 59',
						rating: 4.7,
						imageUrl:
							'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80',
						coordinate: {
							latitude: latitude - 0.0015,
							longitude: longitude - 0.002,
						},
					},
					{
						id: 'csv-3',
						title: 'Titik Temu Sarinah',
						description:
							'Badan Usaha: PT Titik Temu. Menteng, Jakarta Pusat.',
						address: 'Gedung Sarinah Jalan M.H Thamrin Nomor 11',
						rating: 4.9,
						imageUrl:
							'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
						coordinate: {
							latitude: latitude + 0.003,
							longitude: longitude - 0.001,
						},
					},
					{
						id: 'csv-4',
						title: 'Kopi Selamat Pagi',
						description:
							'Kedai kopi populer. Grogol Petamburan, Jakarta Barat.',
						address: 'Jalan Mandala Utara no. 29C RT. 17 RW. 04',
						rating: 4.8,
						imageUrl:
							'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=600&q=80',
						coordinate: {
							latitude: latitude - 0.0025,
							longitude: longitude + 0.003,
						},
					},
					{
						id: 'csv-5',
						title: 'Anomali Coffee',
						description:
							'Roastery asli Indonesia. Mampang Prapatan, Jakarta Selatan.',
						address:
							'Ruko Centra Kemang 72 Jl.Kemang Raya No.72 Unit G',
						rating: 4.9,
						imageUrl:
							'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=600&q=80',
						coordinate: {
							latitude: latitude + 0.001,
							longitude: longitude - 0.0035,
						},
					},
				];

				setCafeLocations(realCsvData);
				if (realCsvData.length > 0) {
					setActiveCafeId(realCsvData[0].id);
				}
				setIsLoading(false);
			} else {
				setIsLoading(false);
				Alert.alert(
					'Izin Lokasi Ditolak',
					'Aplikasi tidak dapat menampilkan lokasi Anda di peta tanpa izin.',
				);
			}
		})();
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

	const onMarkerPress = (index: number) => {
		flatListRef.current?.scrollToIndex({ index, animated: true });
	};

	const onViewableItemsChanged = useRef(
		(info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
			if (info.viewableItems.length > 0) {
				const activeItem = info.viewableItems[0].item as Cafe;
				setActiveCafeId(activeItem.id);

				if (mapRef.current) {
					mapRef.current.animateToRegion(
						{
							latitude: activeItem.coordinate.latitude - 0.003,
							longitude: activeItem.coordinate.longitude,
							latitudeDelta: 0.015,
							longitudeDelta: 0.015,
						},
						350,
					);
				}
			}
		},
	).current;

	const viewabilityConfig = useRef({
		itemVisiblePercentThreshold: 50,
	}).current;

	const getItemLayout = (
		_data: ArrayLike<Cafe> | null | undefined,
		index: number,
	) => ({
		length: CARD_WIDTH + CARD_MARGIN * 2,
		offset: (CARD_WIDTH + CARD_MARGIN * 2) * index,
		index,
	});

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

	const renderCard = ({ item }: { item: Cafe }) => (
		<View style={styles.card}>
			<Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
			<View style={styles.cardContent}>
				<View style={styles.cardHeader}>
					<ThemedText
						type='defaultSemiBold'
						style={styles.cardTitle}
						numberOfLines={1}>
						{item.title}
					</ThemedText>
					<View style={styles.ratingBadge}>
						<Ionicons name='star' size={10} color='#FFD700' />
						<ThemedText style={styles.ratingText}>
							{item.rating}
						</ThemedText>
					</View>
				</View>

				{userLocation && (
					<View style={styles.distanceWrapper}>
						<Ionicons name='location' size={12} color='#A0A3AD' />
						<ThemedText style={styles.distanceText}>
							{calculateDistance(
								userLocation.latitude,
								userLocation.longitude,
								item.coordinate.latitude,
								item.coordinate.longitude,
							)}{' '}
							km
						</ThemedText>
					</View>
				)}

				<ThemedText style={styles.cardDescription} numberOfLines={1}>
					{item.description}
				</ThemedText>

				<TouchableOpacity
					style={styles.actionButton}
					onPress={() =>
						openRouteInMaps(
							item.coordinate.latitude,
							item.coordinate.longitude,
							item.title,
						)
					}>
					<Ionicons name='navigate' size={14} color='#1A1C23' />
					<ThemedText style={styles.actionButtonText}>
						Rute Ke Lokasi
					</ThemedText>
				</TouchableOpacity>
			</View>
		</View>
	);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#FFF' />
			</View>
		);
	}

	return (
		<View style={styles.container}>
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

				{cafeLocations.map((cafe, index) => {
					const isActive = cafe.id === activeCafeId;
					return (
						<Marker
							key={cafe.id}
							coordinate={cafe.coordinate}
							style={{ zIndex: isActive ? 10 : 1 }}
							onPress={() => onMarkerPress(index)}>
							<View style={styles.markerAnchor}>
								<View
									style={[
										styles.bubbleWrap,
										isActive
											? styles.bubbleWrapActive
											: styles.bubbleWrapInactive,
									]}>
									<Ionicons
										name='cafe'
										size={isActive ? 16 : 18}
										color={isActive ? '#1A1C23' : '#FFF'}
									/>
									{isActive && (
										<ThemedText
											style={styles.bubbleText}
											numberOfLines={1}>
											{cafe.title}
										</ThemedText>
									)}
								</View>
								<View
									style={[
										styles.bubbleTail,
										isActive
											? styles.bubbleTailActive
											: styles.bubbleTailInactive,
									]}
								/>
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

			<FlatList
				ref={flatListRef}
				data={cafeLocations}
				horizontal
				pagingEnabled={false}
				scrollEventThrottle={16}
				showsHorizontalScrollIndicator={false}
				snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
				snapToAlignment='center'
				keyExtractor={(item) => item.id}
				renderItem={renderCard}
				getItemLayout={getItemLayout}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				style={styles.carouselList}
				contentContainerStyle={{
					paddingHorizontal:
						Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0,
				}}
				contentInset={{
					top: 0,
					left: SPACING_FOR_CARD_INSET,
					bottom: 0,
					right: SPACING_FOR_CARD_INSET,
				}}
			/>
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
	markerAnchor: {
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	bubbleWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 6,
		elevation: 8,
	},
	bubbleWrapInactive: {
		backgroundColor: '#2A2D3A',
		padding: 10,
		borderWidth: 1.5,
		borderColor: '#4A4D57',
	},
	bubbleWrapActive: {
		backgroundColor: '#FFF',
		paddingVertical: 8,
		paddingHorizontal: 14,
	},
	bubbleText: {
		color: '#1A1C23',
		fontWeight: 'bold',
		fontSize: 14,
		marginLeft: 6,
	},
	bubbleTail: {
		width: 0,
		height: 0,
		backgroundColor: 'transparent',
		borderStyle: 'solid',
	},
	bubbleTailInactive: {
		borderLeftWidth: 6,
		borderRightWidth: 6,
		borderTopWidth: 8,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#2A2D3A',
		marginTop: -1,
	},
	bubbleTailActive: {
		borderLeftWidth: 8,
		borderRightWidth: 8,
		borderTopWidth: 10,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#FFF',
		marginTop: -1,
	},
	recenterButton: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 165 : 155,
		right: 20,
		backgroundColor: 'rgba(42, 45, 58, 0.9)',
		width: 48,
		height: 48,
		borderRadius: 24,
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
	carouselList: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 30 : 20,
	},
	card: {
		flexDirection: 'row',
		backgroundColor: 'rgba(30, 33, 42, 0.95)',
		borderRadius: 20,
		width: CARD_WIDTH,
		marginHorizontal: CARD_MARGIN,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.08)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.5,
		shadowRadius: 12,
		elevation: 10,
		alignItems: 'center',
		padding: 10,
	},
	cardImage: {
		width: 95,
		height: 95,
		borderRadius: 14,
		resizeMode: 'cover',
	},
	cardContent: {
		flex: 1,
		paddingLeft: 14,
		justifyContent: 'center',
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	cardTitle: {
		flex: 1,
		fontSize: 16,
		color: '#FFF',
		marginRight: 6,
		letterSpacing: 0.3,
	},
	ratingBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 215, 0, 0.15)',
		paddingHorizontal: 6,
		paddingVertical: 3,
		borderRadius: 8,
		gap: 4,
	},
	ratingText: {
		color: '#FFD700',
		fontSize: 12,
		fontWeight: 'bold',
	},
	distanceWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
		gap: 4,
	},
	distanceText: {
		fontSize: 12,
		color: '#A0A3AD',
		fontWeight: '500',
	},
	cardDescription: {
		fontSize: 12,
		color: '#8A8D96',
		lineHeight: 16,
		marginBottom: 12,
	},
	actionButton: {
		flexDirection: 'row',
		backgroundColor: '#FFF',
		paddingVertical: 6,
		paddingHorizontal: 14,
		borderRadius: 12,
		alignSelf: 'flex-start',
		alignItems: 'center',
		gap: 6,
	},
	actionButtonText: {
		color: '#1A1C23',
		fontWeight: 'bold',
		fontSize: 12,
	},
});
