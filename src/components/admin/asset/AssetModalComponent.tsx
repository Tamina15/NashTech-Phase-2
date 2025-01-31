import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Container, Modal, Row, Table } from "react-bootstrap";
import { AssetHistoryModel, AssetModel } from "../../../models/AssetModel";
import useSWR from "swr";
import { getOneAssetHistoryUrl } from "../../../services/AssetService";
import { getWithSWR } from "../../../services/swrService";
import { PaginationComponent } from "../../commons/PaginationComponent";
import { LoaderComponent } from "../../commons/LoaderComponent";
import { TableHeaderModel } from "../../../models/TableHeaderModel";
import { useRef, useState } from "react";

type Props = {
    title: string;
    show: boolean;
    onHide: () => void;
    data: string | undefined;
}
type ModalAsset = {
    [key: string]: any; // Add an index signature to support dynamic property access
    assetCode: string;
    name: string;
    category: string;
    installedDate: string;
    location: string;
    specification: string;
    status: string
}

const headers = [
    { name: "Asset Code", value: "assetCode" },
    { name: "Asset Name", value: "name" },
    { name: "Category", value: "category" },
    { name: "Installed Date", value: "installedDate" },
    { name: "State", value: "status" },
    { name: "Location", value: "location" },
    { name: "Specification", value: "specification" },
]

const historyTableHeaders: TableHeaderModel[] = [
    { name: "Date", value: "date", sort: false, direction: false, isCurrentlySorted: false, style: {}, colStyle: {} },
    { name: "Assigned To", value: "assignedTo", sort: false, direction: false, isCurrentlySorted: false, style: {}, colStyle: {} },
    { name: "Assigned By", value: "assignedBy", sort: false, direction: false, isCurrentlySorted: false, style: {}, colStyle: {} },
    { name: "Returned Date", value: "returnedDate", sort: false, direction: false, isCurrentlySorted: false, style: {}, colStyle: {} },
]

function toDateString(date: Date) {
    let d = new Date(date);
    return new Intl.DateTimeFormat("en-GB").format(d);
}

export const AssetModalComponent = (props: Props) => {

    const containerRef = useRef(null);

    const [currentPage, setCurrentPage] = useState({ page: 0, size: 10 });
    const [readMore, setReadMore] = useState<boolean[]>([]);

    const { data: assetHistory, isLoading } = useSWR(props.data ? getOneAssetHistoryUrl(props.data, currentPage.page) : null, getWithSWR, {
        onSuccess: (response) => {
            const data = response.data.data;
            const assetT: AssetModel = data.asset;
            const pageT = data.history;
            const historyT: AssetHistoryModel[] = pageT.content;
            history = (historyT);
            setReadMore(Object.values(assetT).map(a => a.length > 50))
        },
        revalidateOnFocus: true,
        shouldRetryOnError: false
    })

    let asset: ModalAsset | undefined = undefined;
    let history: AssetHistoryModel[] = [];
    let totalPage = 0;

    if (assetHistory) {
        const data = assetHistory.data.data;
        const assetT: AssetModel = data.asset;
        const pageT = data.history;
        const historyT: AssetHistoryModel[] = pageT.content;
        const totalPageT = pageT.totalPages;
        asset = { ...assetT, location: assetT.location.toString(), installedDate: toDateString(assetT.installedDate), status: assetT.state.charAt(0) + assetT.state.slice(1).toLowerCase().replace(/_/g, " ") };
        totalPage = (totalPageT);
        history = (historyT);
    }
    return (
        <Modal {...props} dialogClassName="asset-detail-modal" centered backdrop={false}>
            <Modal.Header >
                <Container style={{ maxWidth: "90%" }}>
                    <Modal.Title id="contained-modal-title-vcenter" className="d-flex justify-content-between align-items-center" style={{ color: "red", fontWeight: "bold" }}>
                        {props.title ?? "Title"}
                        <FontAwesomeIcon icon={faXmark} id="close-modal-button" className="px-1" onClick={props.onHide} style={{ border: "3px red solid", borderRadius: "5px" }}/>
                    </Modal.Title>
                </Container>
            </Modal.Header>
            <Modal.Body>
                <Container style={{ maxWidth: "95%" }} ref={containerRef}>
                    {headers.map((header, index) => {
                        if (asset) {
                            let value = asset[header.value];
                            let isLongerThan60 = asset[header.value].length > 60;
                            if (isLongerThan60 && readMore[index]) {
                                value = asset[header.value].substring(0, 60);
                            }
                            return (
                                <Row className="my-3 justify-content-between" key={header.name} name={"asset_modal_row"}>
                                    <Col sm={2} className="" name={"asset_modal_row_header"}>
                                        {header.name}
                                    </Col>
                                    <Col sm={10} name={"asset_modal_row_data"} style={{ overflow: "auto" }}>
                                        {value}
                                        <span id={"show_more_" + header.value} onClick={() => { readMore[index] = !readMore[index]; setReadMore(() => [...readMore]) }} className="show-more" style={{ color: "red" }}>
                                            {isLongerThan60 ? readMore[index] ? " Show more" : " Show less" : ""}
                                        </span>
                                    </Col>
                                </Row>
                            )
                        }
                    })}
                    <Row className="my-3 justify-content-between" id={"asset_modal_row_history"}>
                        <Col sm={2} className="">
                            History
                        </Col>
                        {isLoading ?
                            <LoaderComponent/> :
                            <Col sm={10} style={{ maxHeight: "500px", height: history.length > 0 ? "460px" : "" }}>
                                <Table hover responsive className='table' id='table' style={{ minWidth: "auto" }}>
                                    <thead id='table-header'>
                                        <tr>
                                            {historyTableHeaders?.map((h) => (
                                                <th key={h.name}>
                                                    {h.name.length > 0 ?
                                                        <div className='header-border'>
                                                            {h.name || '\u200B'}
                                                        </div>
                                                        : '\u200B'
                                                    }
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history ? history.map((h, idx) => (
                                            <tr key={"asset_history_table_row_" + idx} id={"asset_history_table_row_" + idx}>
                                                {historyTableHeaders.map((header, index) => (
                                                    <td key={"history_table_data" + idx + index} id={"history_table_data" + idx + index}>
                                                        <div className='cell'>
                                                            {h[header.value] || '\u200B'}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        )) : ""}
                                    </tbody>
                                </Table>
                            </Col>
                        }
                    </Row>
                    {isLoading ?
                        "" :
                        history && history.length > 0 ?
                            <PaginationComponent currentPage={currentPage.page} totalPage={totalPage} perPage={10} setParamsFunction={setCurrentPage} fixPageSize={true} containerRef={containerRef}></PaginationComponent>
                            :
                            ""
                    }
                </Container>
            </Modal.Body>
        </Modal>
    );
}