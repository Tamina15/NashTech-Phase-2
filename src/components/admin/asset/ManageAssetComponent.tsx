import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { ReactNode, useEffect, useState } from 'react'
import { FunctionalIconModel } from '../../../models/FunctionalIconModel';
import { faPencil, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button, Col, Container, Modal, Row } from 'react-bootstrap';
import { DropdownFilterComponent } from '../../commons/DropdownFilterComponent';
import { LoaderComponent } from '../../commons/LoaderComponent';
import { TableComponent } from '../../commons/TableComponent';
import { PaginationComponent } from '../../commons/PaginationComponent';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { CategoryModel } from '../../../models/CategoryModel';
import { assetFetcher, categoryFetcher, deleteAsset, getAssetUrl, getCategoryUrl, getOneAssetHistory } from '../../../services/AssetService';
import { AssetForTableModel, AssetModel, AssetParamModel } from '../../../models/AssetModel';
import { AssetModalComponent } from './AssetModalComponent';
import { ConfirmModalComponent } from '../../commons/ConfirmModalComponent';
import useSWR from 'swr';
import { SearchComponent } from '../../commons/SearchComponent';
import { BreadcrumbComponent } from '../../commons/BreadcrumbComponent';
import { ColorPalette } from '../../../utils/ColorPalette';
import { TableHeaderModel } from '../../../models/TableHeaderModel';
import { DropdownFilterModel } from '../../../models/DropdownFilterModel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useMessage from 'antd/es/message/useMessage';

const header: TableHeaderModel[] = [
	{ name: 'Asset Code', value: "assetCode", sort: true, direction: true, colStyle: { width: "fit-content" }, style: {}, isCurrentlySorted: true },
	{ name: 'Asset Name', value: "name", sort: true, direction: false, colStyle: { width: "fit-content" }, style: {}, isCurrentlySorted: false },
	{ name: 'Category', value: "category.name", sort: true, direction: false, colStyle: { maxWidth: '200px', width: "fit-content" }, style: {}, isCurrentlySorted: false },
	{ name: 'State', value: "status", sort: true, direction: false, colStyle: { width: "fit-content" }, style: {}, isCurrentlySorted: false }
]
const showModalCell = ["assetCode", "assetName"]
const modalHeader = ["Asset Code", "Asset Name", "Category", "Installed Date", "State", "Location", "Specification"]

type Props = {
	setHeaderTitle: (title: ReactNode) => void
}

export const ManageAssetComponent: React.FC<Props> = (props: Props) => {

	const navigate = useNavigate();
	const location = useLocation();
	const [messageApi, contextHolder] = useMessage();

	useEffect(() => {
		props.setHeaderTitle(<BreadcrumbComponent breadcrumb={[
			{
				title: 'Manage Asset',
				href: `${window.location.origin}/admin/manage-assets#`
			}
		]} />
		);
	}, [])

	const [showDisableModal, setShowDisableModal] = useState(false);
	const [showCannotDisableModel, setShowCannotDisableModel] = useState(false);
	const [deleteAssetCode, setDeleteAssetCode] = useState('');

	const [param, setParam] = useState<AssetParamModel>({
		search: "",
		states: ["ASSIGNED", "AVAILABLE", "NOT_AVAILABLE"],
		categories: undefined,
		page: 0,
		size: 20,
		sort: "assetCode,asc",
	});

	let newAsset = location.state?.newAsset;

	const [modalShow, setModalShow] = useState(false);

	const [modalData, setModalData] = useState<AssetModel>();

	const handleSetParam = (func: (p: AssetParamModel) => AssetParamModel) => {
		const newParam = func(param);
		if (newParam.page === param.page) {
			newParam.page = 0;
		}
		setParam(newParam);
		if (newAsset) {
			navigate(location.pathname, { state: { newAsset: undefined } });
		}
	};

	const { data: category, isLoading: _isLoadingCategory } = useSWR(getCategoryUrl, categoryFetcher, {
		onError: () => {
			messageApi.error("Failed to Load Category")
		},
		revalidateOnFocus: false,
		shouldRetryOnError: false
	})

	if (param.categories === undefined && category) {
		const data = category.data.data as CategoryModel[];
		param.categories = data.map(obj => obj.id.toString())
	}

	const { data: asset, mutate: mutateAsset } = useSWR(param.categories ? getAssetUrl(param) : null, assetFetcher, {
		onError: () => {
			messageApi.error("Failed to Load Asset")
		},
		shouldRetryOnError: false,
		revalidateOnFocus: false,
	});

	let tableAsset: AssetForTableModel[] = [];
	if (asset) {
		let assets = asset.content;
		tableAsset = assets.map(a => {
			return {
				assetCode: a.assetCode,
				assetName: a.name,
				category: a.category,
				state: a.state.charAt(0) + a.state.replace(/_/g, " ").slice(1).toLowerCase()
			}
		})
		if (newAsset) {
			tableAsset = [{
				assetCode: newAsset.assetCode,
				assetName: newAsset.name,
				category: newAsset.category,
				state: newAsset.state.charAt(0) + newAsset.state.replace(/_/g, " ").slice(1).toLowerCase()
			}, ...tableAsset.filter(a => a.assetCode !== newAsset.assetCode)]
		}
		window.history.replaceState({}, '')
		header.forEach(h => { if (h.value === param.sort.split(",")[0]) { h.isCurrentlySorted = true } else { h.isCurrentlySorted = false } })
	}

	// button
	const buttons: FunctionalIconModel[] = [];

	function editAsset(...data: any[]) {
		navigate('/admin/manage-assets/edit', { state: { assetProps: data[1] } })
	}

	const handleDelete = async (assetCode: string) => {
		message.open({
			type: 'loading',
			content: 'Deleting asset...',
		})
			.then(async () => {
				await deleteAsset(assetCode)
					.then((res) => {
						if (newAsset) {
							navigate(location.pathname, { state: { newAsset: undefined } });
						}
						if (res.status == 204) {
							messageApi.success("Asset deleted successfully");
							if (tableAsset.length === 1 && asset?.currentPage !== 1) {
								handleSetParam((p) => ({ ...p, page: 0 }));
							} else {
								mutateAsset();
							}
						}
					})
					.catch((err) => {
						messageApi.error(err.response ? err.response.data.message : "Failed to Delete Asset");
					});
			});
	}

	const handleDeleteConfirm = () => {
		setShowDisableModal(false);
		handleDelete(deleteAssetCode); // Call the Disable function
	}

	const handleDeleteCancel = () => {
		setShowDisableModal(false);
		setDeleteAssetCode('') // Hide the Disable Modal
	}

	async function openModal(...data: any[]) {
		console.log(deleteAssetCode)
		if (deleteAssetCode) return;
		setDeleteAssetCode(data[1].assetCode); // Show the Disable Modal
		messageApi.open({
			type: 'loading',
			content: 'Processing...',
		})
			.then(async () => {
				await getOneAssetHistory(data[1].assetCode, 0)
					.then((response) => {
						const data = response.data.data;
						if (data.history.totalElements === 0) {
							setShowDisableModal(true);
						} else {
							setShowCannotDisableModel(true);
						}
					})
					.catch(() => {
						setDeleteAssetCode("");
					})
			})
	}

	const editIcon: FunctionalIconModel = {
		icon: faPencil,
		style: "",
		onClickfunction: editAsset
	};

	const deleteIcon: FunctionalIconModel = {
		icon: faCircleXmark,
		style: { color: 'red' },
		onClickfunction: openModal
	};

	buttons.push(editIcon, deleteIcon);

	//--------------------------- 

	// Dropdown Filter
	let filterState: DropdownFilterModel[] = [
		{ label: "Assigned", value: "ASSIGNED", defaultChecked: true },
		{ label: "Available", value: "AVAILABLE", defaultChecked: true },
		{ label: "Not available", value: "NOT_AVAILABLE", defaultChecked: true },
		{ label: "Waiting for recyling", value: "WAITING_FOR_RECYCLING", defaultChecked: false },
		{ label: "Recycled", value: "RECYCLED", defaultChecked: false },
	]

	let filterCategory: DropdownFilterModel[] = [];
	category?.data.data.forEach((c: CategoryModel) => { filterCategory.push({ label: c.name, value: c.id.toString(), defaultChecked: true }) });

	//----------------------------

	//---------------------
	let disableButtonArray: boolean[][] = tableAsset.map(a => { return a.state === "Assigned" ? [true, true] : [false, false] });
	///////////////////////

	return (
		<Container>
			{contextHolder}
			<h4 style={{ color: ColorPalette.PRIMARY_COLOR }} className='fw-bold fs-4 ms-1 mt-5 mb-3'>
				Asset List
			</h4>
			<Row className="py-4 ms-0 pe-2 user-param-row justify-content-between  align-items-center">
				<Col sm={6}>
					<Row>
						<Col sm={6} className=" ">
							<DropdownFilterComponent title={"State"} data={filterState} params={param.states} setParamsFunction={handleSetParam} style={{ width: "100%" }} defaultAll={false} paramName={'states'} ></DropdownFilterComponent>
						</Col>
						<Col sm={6} className=" ">
							<DropdownFilterComponent title={"Category"} data={filterCategory} params={param.categories} setParamsFunction={handleSetParam} style={{ width: "100%" }} defaultAll={true} paramName={'categories'}></DropdownFilterComponent>
						</Col>
					</Row>
				</Col>
				<Col sm={6}>
					<Row>
						<Col sm={8} className="d-flex justify-content-end align-items-center">
							<SearchComponent placeholder={"Search by Name or Asset Code"} setParamsFunction={handleSetParam} style={{ width: "100%" }} setDummy={() => { }} class={''}></SearchComponent>
						</Col>
						<Col sm={4} className="d-flex justify-content-end align-items-center" style={{ maxWidth: "230px" }}>
							<Button variant="danger" onClick={() => { return navigate('./new') }} style={{ width: "230px" }}>Create New Asset</Button>
						</Col>
					</Row>
				</Col>
			</Row>
			{!asset ?
				<LoaderComponent></LoaderComponent>
				:
				<>
					{tableAsset.length === 0 ?
						<Row>
							<h4 className="text-center"> No Asset Found</h4>
						</Row> :
						<>
							<Row className='ps-2'>
								<p className='fs-5' style={{ color: "gray" }}>
									Total : {asset.totalElements}
								</p>
							</Row>
							<Row>
								<TableComponent headers={header} datas={tableAsset} auxData={tableAsset} auxHeader={modalHeader} buttons={buttons} setSortParam={handleSetParam} showModalCell={showModalCell} setDummy={() => { }} setModalData={setModalData} setModalShow={setModalShow} pre_button={undefined} disableButton={disableButtonArray}  ></TableComponent>
							</Row>
							<PaginationComponent currentPage={param.page} setParamsFunction={handleSetParam} totalPage={asset.totalPage} perPage={param.size} fixPageSize={false} containerRef={undefined} ></PaginationComponent>
						</>
					}
				</>
			}

			<AssetModalComponent
				title={"Detailed Asset Information"}
				show={modalShow}
				onHide={() => setModalShow(false)}
				data={modalData?.assetCode}
			/>
			<ConfirmModalComponent show={showDisableModal} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} confirmTitle={'Delete Confirmation'} confirmQuestion={'Do you want to delete this asset?'} confirmBtnLabel={'Yes'} cancelBtnLabel={'No'} modalSize={"md"} />
			<Modal show={showCannotDisableModel}
				centered
				backdrop="static">
				<Modal.Header>
					<Container>
						<Modal.Title id="contained-modal-title-vcenter" className="d-flex justify-content-between align-items-center" style={{ color: ColorPalette.PRIMARY_COLOR, fontWeight: "bold" }}>
							Cannot Delete Asset
							<FontAwesomeIcon
								onClick={
									() => {
										setShowCannotDisableModel(false);
										setDeleteAssetCode('');
									}
								}
								icon={faXmark} id="close-modal-button" className="px-1" style={{ border: "3px red solid", borderRadius: "5px" }}></FontAwesomeIcon>
						</Modal.Title>
					</Container>
				</Modal.Header>
				<Modal.Body>
					<div className="success-message mx-2">
						Cannot delete the asset because it belongs to one or more historical assignments.<br />
						If the asset is not able to be used anymore, please update its state in&nbsp;
						<a
							type="button"
							className='btn-link'
							onClick={
								() => {
									const data = tableAsset.find(a => a.assetCode === deleteAssetCode);
									editAsset([], data);
									setDeleteAssetCode('');
								}
							}
						>  Edit Asset page </a>
					</div>
				</Modal.Body>
			</Modal>
		</Container>
	);
}

