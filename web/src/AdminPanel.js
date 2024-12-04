import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AdminPanel.css';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import Pagination from '@mui/material/Pagination';
import EditUserPopup from './EditUserPopup';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast, toast } from 'primereact/toast';
import { FullFileBrowser, ChonkyActions, defineFileAction } from 'chonky';
import { setChonkyDefaults } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';

function AdminPanel() {
    const navigate = useNavigate();
    const userToken = Cookies.get("userToken");

    //USERS
    const [userManagement, setUserManagement] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [userList, setUserList] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [usernameFilter, setUsernameFilter] = useState("");
    const [emailFilter, setEmailFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [activatedFilter, setActivatedFilter] = useState(false);
    const [notActivatedFilter, setNotActivatedFilter] = useState(false);
    const [usersPerPage, setUsersPerPage] = useState(10);
    const [showEditUserPopup, setShowEditUserPopup] = useState(false);
    const [userToEditId, setUserToEditId] = useState(null);

    const toast = useRef(null);

    const serverUrl = process.env.OLLAMA_URL || 'http://localhost:3000';

    useEffect(() => {
        if (!userToken || (Cookies.get("userRole")=="user")) {
            navigate('/');
        }
    }, [userToken, navigate]);

    const handleToggleUserManagement = () => {
        setUserManagement(true);
    };

    const handleToggleFileManagement = () => {
        setUserManagement(false);
    };

    const handleSearch = async () => {
        let newQuery = `limit=${usersPerPage.toString()}&page=${currentPage}`;
        if (usernameFilter) newQuery += `&name=${usernameFilter}`;
        if (emailFilter) newQuery += `&email=${emailFilter}`;
        if (roleFilter) newQuery += `&role=${roleFilter}`;
        if (activatedFilter && !notActivatedFilter) newQuery += `&activated=true`;
        if (!activatedFilter && notActivatedFilter) newQuery += `&activated=false`;
        setCurrentPage(1);
        fetchUsers(newQuery);
    };

    const handleResetFilters = () => {
        setUsernameFilter("");
        setEmailFilter("");
        setRoleFilter("");
        setActivatedFilter(false);
        setNotActivatedFilter(false);
        setUsersPerPage(10);
        setCurrentPage(1);
        fetchUsers("limit=10&page=1");
    };

    const handleEditUser = (userId) => {
        setUserToEditId(userId);
        setShowEditUserPopup(true);
    };

    const confirmActivateUser = (userToActivateId) => {
        confirmDialog({
            message: 'Czy na pewno chcesz aktywować tego użytkownika?',
            header: 'Aktywuj użytkownika',
            icon: 'pi pi-exclamation-triangle',
            accept: () => activateUser(userToActivateId),
            acceptClassName: 'p-button-success',
            acceptLabel: "Tak",
            rejectClassName: 'p-button-danger',
            rejectLabel: "Nie"
        });
    };

    const confirmDeleteUser = (userToDeleteId) => {
        confirmDialog({
            message: 'Czy na pewno chcesz usunąć tego użytkownika?',
            header: 'Usuń użytkownika',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteUser(userToDeleteId),
            acceptClassName: 'p-button-success',
            acceptLabel: "Tak",
            rejectClassName: 'p-button-danger',
            rejectLabel: "Nie"
        });
    };

    const activateUser = async (userToActivateId) => {
        try {
            await fetch(`${serverUrl}/api/v1/users/${userToActivateId}/activate`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
            });
            toast.current.show({ severity: 'success', summary: 'Sukces!', detail: 'Pomyślnie aktywowano konto', life: 3000 });
            fetchUsers();
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteUser = async (userToDeleteId) => {
        try {
            await fetch(`${serverUrl}/api/v1/users/${userToDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
            });
            toast.current.show({ severity: 'success', summary: 'Sukces!', detail: 'Pomyślnie usunięto konto', life: 3000 });
            fetchUsers();
        } catch (error) {
            alert(error.message);
        }
    };

    const fetchUsers = async (queryParams) => {
        try {
            const response = await fetch(`${serverUrl}/api/v1/users/list?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
            });
            const data = await response.json();
            setUserList(data.users || []);
            const total = data.pagination.totalPages || 0;
            setTotalPages(Math.ceil(total));
        } catch (error) {
            console.error("Error fetching users:", error);
            setUserList([]);
        }
    };

    useEffect(() => {
        fetchUsers(`limit=${usersPerPage}&page=${currentPage}`);
    }, [currentPage, usersPerPage, userToken]);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    //FILES

    const [fileList, setFileList] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderChain, setFolderChain] = useState([{ id: '0', name: "Baza plików", isDir: true }]);

    // Set Chonky Defaults
    setChonkyDefaults({ iconComponent: ChonkyIconFA });

    const createFolderAction = defineFileAction({
        id: 'create_folder',
        button: {
            name: 'Nowy folder',
            toolbar: true,
            contextMenu: true,
            icon: 'folderCreate',
        },
    });

    const uploadFileAction = defineFileAction({
        id: 'upload_file',
        button: {
            name: 'Wgraj plik',
            toolbar: true,
            contextMenu: true,
            icon: 'upload', // ikona z FontAwesome lub innej biblioteki
        },
    });

    const fetchFiles = async (folderId = null) => {
        try {
            const queryParam = (folderId !== null && folderId != 0) ? `?folderId=${folderId}` : '';
            const response = await fetch(`${serverUrl}/api/v1/files/list${queryParam}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
            });
            const data = await response.json();
            const formattedFiles = data.files.map(file => ({
                id: file.id.toString(),
                name: file.type === 'folder' ? file.name : `${file.name}.${file.type}`,
                isDir: file.type === 'folder',
            }));
            setFileList(formattedFiles);
        } catch (error) {
            console.error("Error fetching files:", error);
            setFileList([]);
        }
    };


    useEffect(() => {
        fetchFiles(currentFolderId);
    }, [currentFolderId]);

    // Folder Creation Function
    const createFolder = async (folderName) => {
        try {
            const bodyData = {};
            bodyData.name = folderName;
            if (currentFolderId != null && currentFolderId != 0) bodyData.parentFolderId = currentFolderId;
            const response = await fetch(`${serverUrl}/api/v1/files/folders/new`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });
            if (response.ok) {
                fetchFiles(currentFolderId); // Refresh file list after folder creation
            } else {
                console.error("Error creating folder:", await response.text());
            }
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const handleFileAction = useCallback((action) => {
        if (action.id === ChonkyActions.OpenFiles.id && action.payload.files.length === 1) {
            const file = action.payload.files[0];
            if (file.isDir) {
                const newFolderId = file.id;

                const folderIndex = folderChain.findIndex(folder => folder.id === newFolderId);
                if (folderIndex !== -1) {
                    const updatedFolderChain = folderChain.slice(0, folderIndex + 1);
                    setFolderChain(updatedFolderChain);
                } else {
                    setFolderChain(prevChain => [...prevChain, { id: newFolderId, name: file.name, isDir: true }]);
                }
                setCurrentFolderId(newFolderId);
                fetchFiles(newFolderId);
            }
        } else if (action.id === 'create_folder') {
            const folderName = prompt("Podaj nazwę nowego folderu:");
            if (folderName) {
                createFolder(folderName);
            }
        } else if (action.id === 'upload_file') {
            // Akcja wgrywania pliku
            const inputFile = document.createElement('input');
            inputFile.type = 'file';
            inputFile.onchange = (e) => {
                const file = e.target.files[0];  // Pobierz wybrany plik
                if (file) {
                    uploadFile(file);
                }
            };
            inputFile.click();  // Otwórz okno dialogowe wyboru pliku
        }
    }, [folderChain, createFolder]);

    const uploadFile = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderId', currentFolderId || '0');  // Dodaj folder, w którym plik ma być zapisany

            const response = await fetch(`${serverUrl}/api/v1/files/upload${(currentFolderId != null && currentFolderId != 0) ? `?folderId=${currentFolderId}` : ""}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                // Jeśli upload był udany, odśwież listę plików
                fetchFiles(currentFolderId);
            } else {
                console.error("Error uploading file:", await response.text());
            }
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };




    return (
        <div className="adminApp">
            {showEditUserPopup && <EditUserPopup userId={userToEditId} />}
            <div className="adminSideBar">
                <div className="adminUpperSideContainer">
                    <button className="backButton" onClick={() => navigate(`/chat/`)}>⯇</button>
                    <div className="adminUpperSideTop">ADMIN</div>
                </div>
                <button
                    className={userManagement ? "userManagementButtonActive" : "userManagementButtonInactive"}
                    onClick={handleToggleUserManagement}
                    disabled={userManagement}
                >
                    <span>Użytkownicy</span>
                </button>
                <button
                    className={userManagement ? "fileManagementButtonInactive" : "fileManagementButtonActive"}
                    onClick={handleToggleFileManagement}
                    disabled={!userManagement}
                >
                    <span>Pliki</span>
                </button>
            </div>
            <div className={showFilters ? "adminMain adminMainFilters" : "adminMain"}>
                {userManagement && (
                    <div>
                        <ConfirmDialog />
                        <Toast ref={toast} />
                        <div className='adminUserTopContainer'>
                            <div>
                                <label>Szukaj użytkownika:</label>
                                <input
                                    className="filterTextInput"
                                    type="text"
                                    placeholder='Nazwa lub email'
                                    value={usernameFilter}
                                    onChange={(e) => setUsernameFilter(e.target.value)} />
                                <button className='adminButton filterButton' onClick={handleSearch}>Szukaj</button>
                            </div>
                            <div className='filtersContainer'>
                                <button
                                    className="adminButton filterButton"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    Filtry
                                </button>
                            </div>
                        </div>
                        <table className="userTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nazwa</th>
                                    <th>Email</th>
                                    <th>Rola</th>
                                    <th>Status</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userList.length > 0 && userList
                                    .sort((a, b) => b.id - a.id)
                                    .map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role === "admin" ? "Administrator" : "Użytkownik"}</td>
                                            <td>{user.activated ? "Aktywne" : "Nieaktywowane"}</td>
                                            <td>
                                                <div className='buttonContainer'>
                                                    {!user.activated && (
                                                        <button
                                                            className='adminButton activateButton'
                                                            onClick={() => confirmActivateUser(user.id)}>
                                                            Aktywuj
                                                        </button>
                                                    )}
                                                    {user.activated && (
                                                        <button
                                                            className={user.name === "superadmin" ? "adminButton inactiveButton" : "adminButton"}
                                                            disabled={user.name === "superadmin"}
                                                            onClick={() => handleEditUser(user.id)}>
                                                            Edytuj
                                                        </button>
                                                    )}
                                                    <button
                                                        className={user.name === "superadmin" ? "adminButton inactiveButton" : "adminButton deleteButton"}
                                                        disabled={user.name === "superadmin"}
                                                        onClick={() => confirmDeleteUser(user.id)}>
                                                        Usuń
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <div className="pagination-container">
                            <Pagination
                                className="custom-pagination"
                                count={totalPages}
                                page={currentPage}
                                siblingCount={1}
                                onChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
                {!userManagement && (
                    <div className="fileManagement">
                        <div className="chonky-file-browser">
                            <FullFileBrowser
                                files={fileList}
                                onFileAction={handleFileAction}
                                fileActions={[createFolderAction, uploadFileAction]}
                                folderChain={folderChain}
                            />
                        </div>
                    </div>
                )}
            </div>
            {showFilters && userManagement && (
                <div className={`filterSideBar ${showFilters ? 'show' : ''}`}>
                    <div className='filterTitle'>Filtry</div>
                    <hr className='line' />
                    <label>Rola:</label><br />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">dowolna</option>
                        <option value="admin">Administrator</option>
                        <option value="user">Użytkownik</option>
                    </select>
                    <hr className='line' />
                    <label>Status konta:</label>
                    <div className='labelContainer'>
                        <label>Aktywowany</label>
                        <input
                            type="checkbox"
                            checked={activatedFilter}
                            onChange={() => {
                                setActivatedFilter(!activatedFilter);
                                if (notActivatedFilter && !activatedFilter) {
                                    setNotActivatedFilter(false); // Odznaczenie przeciwstawnego filtra
                                }
                            }}
                        />
                    </div>
                    <div className='labelContainer'>
                        <label>Nieaktywowany</label>
                        <input
                            type="checkbox"
                            checked={notActivatedFilter}
                            onChange={() => {
                                setNotActivatedFilter(!notActivatedFilter);
                                if (activatedFilter && !notActivatedFilter) {
                                    setActivatedFilter(false); // Odznaczenie przeciwstawnego filtra
                                }
                            }}
                        />
                    </div>

                    <hr className='line' />
                    <label>Ilość wyświetlanych użytkowników na stronie:</label><br />
                    <select value={usersPerPage} onChange={(e) => setUsersPerPage(e.target.value)}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                    </select>
                    <div className='buttonContainer filterButtonContainer'>
                        <button className='adminButton filterButton' onClick={handleSearch}>Zastosuj filtry</button>
                        <button className='adminButton filterButton' onClick={handleResetFilters}>Resetuj filtry</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
