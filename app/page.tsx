'use client'
import {useState, useEffect} from "react";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {Icon} from "@iconify/react";
import Link from "next/link";
import createApolloClient from "../apollo-client";
import { ADD_CONTACT, ADD_PHONE_NUMBER, UPDATE_CONTACT, UPDATE_PHONE_NUMBERS, DELETE_CONTACT, GET_CONTACTS_LIST } from "./utils/gql";

const Page = () => {
    const client = createApolloClient();
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [saveNumber, setSaveNumber] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [contacts, setContacts] = useState([{
        id: "",
        first_name: "",
        last_name: "",
        phones: [{
            number: "",
        }],
    }]);
    const [filteredContacts, setFilteredContacts] = useState([{
        id: "",
        first_name: "",
        last_name: "",
        phones: [{
            number: "",
        }],
    }]);
    const [phonesField, setPhonesField] = useState([{
        number: "",
    }]);
    const [isNotFound, setIsNotFound] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isContactsLoading, setIsContactsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoggedIn, setisLoggedIn] = useState(false);
    const [shouldUpdate, setShouldUpdate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [contactId, setContactId] = useState(null);

    const getContacts = async () => {
        const { data } = await client.query({
            query: GET_CONTACTS_LIST,
        });
        console.log(data.contact);
        if (data.contact) {
            setContacts(data.contact);
            setFilteredContacts(data.contact);
            setIsLoading(false);
            setIsContactsLoading(false);
        } else {
            setContacts(data.contact);
            setFilteredContacts(data.contact);
            setIsError(false);
            setIsContactsLoading(false);
        }
    };

    const handleChange = (e: any) => {
        if (e.target.name == "firstName") {
            setFirstName(e.target.value);
        } else if (e.target.name == "lastName") {
            setLastName(e.target.value);
        }
    };

    const saveContact = async () => {
        // Regular expression to check for special characters
        const specialCharacterRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\]/;

        // Check if the first name contains special characters
        if (specialCharacterRegex.test(firstName)) {
            toast.error("First name cannot contain special characters.");
            return;
        }

        // Check if the last name contains special characters
        if (specialCharacterRegex.test(lastName)) {
            toast.error("Last name cannot contain special characters.");
            return;
        }

        try {
            const response = await client.mutate({
                mutation: ADD_CONTACT,
                variables: {
                    first_name: firstName,
                    last_name: lastName,
                    phones: phonesField
                },
            });
            console.log(response);
            toast.success("Contact saved successfully!");
            setFirstName("");
            setLastName("");
            setPhonesField([{ number: "" }]);
            setSaveNumber(!saveNumber);
            setIsSaving(false);
            getContacts();
        } catch (e: any) {
            toast.error(e.message);
            setIsSaving(false);
        }
    };

    const searchNumber = (e: any) => {
        let searchValue = e.target.value;
        setSearchText(searchValue);
        const filteredContacts = contacts.filter((contact) => {
            return contact.first_name.toLowerCase().includes(searchValue.toLowerCase()) || contact.last_name.toLowerCase().includes(searchValue.toLowerCase());
        });
        if (filteredContacts.length == 0) {
            setFilteredContacts(filteredContacts);
            setIsNotFound(true);
        } else {
            setIsNotFound(false);
            setFilteredContacts(filteredContacts);
        }
        // alert(JSON.stringify(filteredContacts,null,3))
    };

    const copyNumber = async (number: any) => {
        try {
            await window.navigator.clipboard.writeText(number);
            toast.success("Number (" + number.toString() + ") copied successful");
        } catch (e) {
            toast.error("Copy functionality is not supported in your browser!");
        }
    };

    const editContact = (id: any) => {
        setShouldUpdate(true);
        const [obj] = contacts.filter((cnt) => cnt.id == id);
        setFirstName(obj.first_name);
        setLastName(obj.last_name);
        setPhonesField(obj.phones);
        setSaveNumber(!saveNumber);
        setContactId(id);
        // setContacts(contacts.filter((cnt) => cnt.id != id));
        // Let's update
    };

    const updateContact = async () => {
        // Regular expression to check for special characters
        const specialCharacterRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\]/;

        // Check if the first name contains special characters
        if (specialCharacterRegex.test(firstName)) {
            toast.error("First name cannot contain special characters.");
            return;
        }

        // Check if the last name contains special characters
        if (specialCharacterRegex.test(lastName)) {
            toast.error("Last name cannot contain special characters.");
            return;
        }

        try {
            await client.mutate({
                mutation: UPDATE_CONTACT,
                variables: {
                    id: contactId,
                    _set: {
                        first_name: firstName,
                        last_name: lastName
                    }
                },
            });

            const selectedContact:any = contacts.filter((cnt) => cnt.id == contactId);
            console.log(selectedContact);
            if (phonesField.length > selectedContact[0].phones.length || phonesField.length < selectedContact[0].phones.length){
                await client.mutate({
                    mutation: ADD_PHONE_NUMBER,
                    variables: {
                        contact_id: selectedContact.id,
                        phone_number: phonesField[phonesField.length-1].number
                    },
                });
            } else {
                for (let i = 0; i < phonesField.length; i++) {
                    await client.mutate({
                        mutation: UPDATE_PHONE_NUMBERS,
                        variables: {
                            pk_columns: {
                                contact_id: selectedContact[0].id,
                                number: selectedContact[0].phones[i].number
                            },
                            new_phone_number: phonesField[i].number
                        },
                    });
                }
            }
            getContacts();
            toast.success("Contact updated successfully!");
            setFirstName("");
            setLastName("");
            setPhonesField([{ number: "" }]);
            setSaveNumber(!saveNumber);
            setIsUpdating(false);
        } catch (e: any) {
            toast.error(e.message);
            setIsUpdating(false);
            console.log(e);
        }
    };

    const deleteContact = (id: any) => {
        setDeleteConfirm(true);
        setContactId(id);
    };

    const doDeleteContact = async () => {
        try {
            await client.mutate({
                mutation: DELETE_CONTACT,
                variables: {
                    id: contactId,
                },
            });
            getContacts();
            toast.success("Contact deleted successfully!");
            setDeleteConfirm(false);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Calculate the start and end index for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Slice the contacts for the current page
    const currentPageContacts = filteredContacts.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

    useEffect(() => {
        setisLoggedIn(true);
        setIsLoading(false);
        getContacts();
    }, []);
    return (
        <div className="">
            <ToastContainer/> {
            isLoggedIn && !isLoading ? (
                <div className="">
                    <div className="bg-gray-800 p-4">
                        <div className="flex justify-between">
                            <h2 className="text-2xl text-center text-white font-bold ">
                                Phone Book
                            </h2>
                        </div>
                        <div className="relative">
                            <p className="absolute top-[19px] left-2 text-xl">
                                <Icon color="#999" icon="material-symbols:search"/>
                            </p>
                            <input onChange={searchNumber}
                                className="mt-2 px-2 pl-8 h-10 w-full border border-1 border-gray-300 rounded focus:outline-none text-md"
                                type="text"
                                name="search"
                                id="search"
                                value={searchText}
                                placeholder="Search name"/>
                        </div>
                        <button onClick={
                                () => {
                                    setShouldUpdate(false);
                                    setFirstName("");
                                    setSaveNumber(!saveNumber);
                                }
                            }
                            className="w-full h-10 mt-3 border border-1 border-white px-3 py-1 rounded text-white">
                            Add New Contact
                        </button>
                    </div>
                    {/*Form To Save Number*/}
                    {
                    saveNumber && (
                        <div className="px-4 bg-gray-800 mb-5 rounded">
                            <div className="relative">
                                <p className="absolute left-1 top-2 text-2xl">
                                    <Icon color="#555" icon="material-symbols:person"/>
                                </p>
                                <input onChange={handleChange}
                                    className="px-2 pl-7 h-10 w-full border border-1 border-black rounded focus:outline-none"
                                    type="text"
                                    name="firstName"
                                    id=""
                                    value={firstName}
                                    placeholder="First Name"/>
                            </div>
                            <div className="relative">
                                <p className="absolute left-1 top-2 text-2xl">
                                    <Icon color="#555" icon="material-symbols:person"/>
                                </p>
                                <input onChange={handleChange}
                                    className="px-2 pl-7 h-10 w-full border border-1 border-black rounded focus:outline-none"
                                    type="text"
                                    name="lastName"
                                    id=""
                                    value={lastName}
                                    placeholder="Last Name"/>
                            </div>
                            {
                                phonesField.map((field, index) => {
                                    var number = index+1;
                                    return (
                                        <div className="relative" key={index}>
                                            <p className="absolute left-1 top-2 text-2xl">
                                                <Icon color="#555" icon="material-symbols:phone-enabled-sharp"/>
                                            </p>
                                            <input onChange={
                                                    (e) => {
                                                        const newFields = [...phonesField];
                                                        newFields[index] = {
                                                            number: e.target.value
                                                        };
                                                        setPhonesField(newFields);
                                                    }
                                                }
                                                className="px-2 pl-7 h-10 w-full border border-1 border-black rounded focus:outline-none"
                                                type="text"
                                                name="number"
                                                id=""
                                                value={field.number}
                                                placeholder={`Phone Number `+number}/>
                                            <p onClick={
                                                    () => {
                                                        const newFields = [...phonesField];
                                                        newFields.splice(index, 1);
                                                        setPhonesField(newFields);
                                                    }
                                                }
                                                className="absolute right-1 top-2 text-2xl cursor-pointer">
                                                <Icon color="#555" icon="material-symbols:delete"/>
                                            </p>
                                        </div>
                                    );
                                })
                            }
                            <button disabled={isSaving}
                                onClick={
                                    () => {
                                        const newFields = [...phonesField];
                                        newFields.push({number: ""});
                                        setPhonesField(newFields);
                                    }
                                }
                                className="relative w-full my-4 h-10 border border-1 border-white px-3 py-1 rounded text-white disabled:bg-gray-100 disabled:text-black">
                                Add More Phone Number
                                <p className="absolute top-3 right-[120px]">
                                    <Icon icon="majesticons:plus-line" color="#f8f8f8"/>
                                </p>
                            </button>
                            {
                            shouldUpdate ? (
                                <button disabled={isUpdating}
                                    onClick={updateContact}
                                    className="relative w-full my-4 h-10 border border-1 border-white px-3 py-1 rounded text-white disabled:bg-gray-100 disabled:text-black">
                                    Update
                                    <p className="absolute top-3 right-[120px]">
                                        <Icon icon="mdi:content-save-move" color="#f8f8f8"/>
                                    </p>
                                </button>
                            ) : (
                                <button disabled={isSaving}
                                    onClick={saveContact}
                                    className="relative w-full my-4 h-10 border border-1 border-white px-3 py-1 rounded text-white disabled:bg-gray-100 disabled:text-black">
                                    Save
                                    <p className="absolute top-3 right-[120px]">
                                        <Icon icon="mdi:content-save-move" color="#f8f8f8"/>
                                    </p>
                                </button>
                            )
                        } </div>
                    )
                }
                    {/*Cart To Display Number*/}
                    <div className="mt-10 m-5 border border-2 border-gray-200 py-4 rounded h-[400px] overflow-y-auto">
                        {/*Show Deletion Confirm*/}
                        {
                        deleteConfirm && (
                            <div className="absolute bg-gray-900 opacity-[0.98] z-20 top-0 left-0 right-0 bottom-0 h-[100vh] w-full">
                                <div className="top-0 left-4 right-4 absolute rounded-b bg-white opacity-[1] text-black p-3">
                                    <h2 className="font-bold text-4xl">Alert!</h2>
                                    <p className="mb-3">
                                        Are you sure you want to delete this contact?
                                    </p>
                                    <button onClick={doDeleteContact}
                                        className="bg-red-600 text-white rounded px-2 py-1">
                                        Im Sure
                                    </button>
                                    <button onClick={
                                            () => setDeleteConfirm(false)
                                        }
                                        className="ml-2 bg-indigo-600 text-white rounded px-2 py-1">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )
                    }
                        {/*Show Number Not Found Message*/}
                        {/*isNotFound && <p className="text-center text-red-500 text-sm font-bold my-3">Number not found!</p>*/}
                        {
                        isError && (
                            <p className="text-center text-red-500 text-sm font-bold my-3">
                                Oops!something went wrong
                            </p>
                        )
                    }
                        {
                        !isContactsLoading && !isLoading && filteredContacts.length == 0 && (
                            <p className="text-center text-red-500 text-sm font-bold my-3">
                                No contact found!
                            </p>
                        )
                    }
                        {
                        isContactsLoading && (
                            <img className="h-10 w-10 mx-auto my-3" src="/loading2.gif" alt=""/>
                        )
                    }
                        {
                        filteredContacts && filteredContacts.length > 0 ? currentPageContacts.map((contact) => {
                            return(!isContactsLoading && (
                                <div className="relative m-4 bg-gray-800 text-white px-3 py-2 rounded" key={contact.id}>
                                    {/*<span className="text-black absolute right-2 top-2 bg-slate-100 text-black px-2 rounded text-sm" onClick={()=>copyNumber(contact.number)}>Copy</span>*/}
                                    {/*<p className="absolute left-2 top-2 text-2xl"><Icon icon="ic:baseline-perm-contact-calendar" /></p>*/}
                                    <div className="flex justify-center items-center">
                                        {/*<span className="text-2xl bg-white p-1 rounded-t-full rounded-b-full"><Icon color="black" icon="material-symbols:contacts" /></span>*/} </div>
                                    <div className="my-3">
                                        <h2 className="text-2xl font-bold">
                                            {
                                                contact.first_name.slice(0, 1).toUpperCase()
                                            }
                                            {
                                                contact.first_name.slice(1, contact.first_name.length) + " "
                                            } 
                                            {
                                                contact.last_name.slice(0, 1).toUpperCase()
                                            }
                                            {
                                                contact.last_name.slice(1, contact.last_name.length)
                                            } 
                                        </h2>
                                        <div className="mt-2 mb-4">
                                            {contact.phones.length > 0 ? contact.phones.map((num) => {
                                                return (
                                                    <p className="font-light flex items-center space-x-1" key={num.number}>
                                                        <Icon icon="mdi:telephone" color="white"/>{" "}<span>{num.number}</span>
                                                    </p>
                                                )}) : (
                                                    <p className="font-light flex items-center space-x-1">
                                                        <Icon icon="mdi:telephone" color="white"/>{" "}<span>Phone number not found!</span>
                                                    </p>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className="my-2 flex justify-evenly">
                                        {contact.phones.length > 0 && (
                                            <p className="text-md">
                                            <Icon onClick={
                                                    () => copyNumber(contact.phones[0].number)
                                                }
                                                icon="material-symbols:content-copy-outline-rounded"/>
                                            </p>)
                                        }
                                        
                                        <p className="text-md">
                                            <Icon onClick={
                                                    () => editContact(contact.id)
                                                }
                                                icon="material-symbols:edit-square-outline-rounded"/>
                                        </p>
                                        <p className="text-md">
                                            <Icon onClick={
                                                    () => deleteContact(contact.id)
                                                }
                                                icon="material-symbols:delete-outline-rounded"/>
                                        </p>
                                        {/* <Link className="text-md"
                                            href={
                                                `tel:${
                                                    contact.number
                                                }`
                                        }>
                                            <Icon icon="material-symbols:add-call-sharp"/>
                                        </Link> */}
                                    </div>
                                </div>
                            ));
                        }) : isLoading && !isNotFound && !isError && (
                            <img className="h-10 w-10 mx-auto my-3" src="/loading2.gif" alt=""/>
                        )
                        
                    } 
                    {/* Pagination */}
                        <div className="flex justify-center items-center">
                            <button disabled={currentPage == 1}
                                onClick={
                                    () => handlePageChange(currentPage - 1)
                                }
                                className="bg-gray-800 text-white px-3 py-1 rounded">
                                Prev
                            </button>
                            {
                            Array(totalPages).fill("").map((_, index) => (
                                <button key={index}
                                    onClick={
                                        () => handlePageChange(index + 1)
                                    }
                                    className={`mx-2 px-3 py-1 rounded ${
                                        currentPage == index + 1 ? "bg-gray-800 text-white" : "bg-gray-300 text-gray-800"
                                    }`}>
                                    {
                                    index + 1
                                } </button>
                            ))
                            }
                            <button disabled={currentPage == totalPages}
                                onClick={
                                    () => handlePageChange(currentPage + 1)
                                }
                                className="bg-gray-800 text-white px-3 py-1 rounded">
                                Next
                            </button>
                        </div>
                    </div>
                    <Link className="text-sm underline text-center block" href="https://t.me/fhrabbi">
                        Report a problem
                    </Link>
                </div>
            ) : (
                <img className="h-10 w-10 mx-auto my-3" src="/loading2.gif" alt=""/>
            )
        } </div>
    );
};

export default Page;
