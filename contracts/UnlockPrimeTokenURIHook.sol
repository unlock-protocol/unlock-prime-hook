// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @notice Functions to be implemented by a tokenURIHook.
 * @dev Lock hooks are configured by calling `setEventHooks` on the lock.
 */
contract UnlockPrimeTokenURIHook {
    /**
     * @notice If the lock owner has registered an implementer
     * then this hook is called every time `tokenURI()` is called
     * @param lockAddress the address of the lock
     * @param operator the msg.sender issuing the call
     * @param owner the owner of the key for which we are retrieving the `tokenUri`
     * @param keyId the id (tokenId) of the key (if applicable)
     * @param expirationTimestamp the key expiration timestamp
     * @return the tokenURI
     */
    function tokenURI(
        address lockAddress,
        address operator,
        address owner,
        uint256 keyId,
        uint expirationTimestamp
    ) public view returns (string memory) {
        string memory title = string(
            abi.encodePacked(
                ' <text><textPath href="#P" startoffset="1" text-anchor="middle" dominant-baseline="middle" fill="black" font-size="14px">',
                "UNLOCK PRIME",
                "</textPath></text>"
            )
        );

        // draw svg by combining all layers
        string memory svg = string(
            abi.encodePacked(
                '<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#F2C65E"/><path fill-rule="evenodd" clip-rule="evenodd" d="M555.519 0L487 90H553.481L622 0H555.519Z" fill="white"/><g filter="url(#filter0_d_2018_2607)"><g clip-path="url(#clip0_2018_2607)"><rect x="237" y="54" width="574" height="922" rx="24" fill="#F5F5F5"/><path d="M237 54H811V126H237V54Z" fill="#F5F5F5"/><path d="M488 90C488 87.7909 489.791 86 492 86H556C558.209 86 560 87.7909 560 90V90C560 92.2091 558.209 94 556 94H492C489.791 94 488 92.2091 488 90V90Z" fill="#F2C65E"/><rect width="574" height="166" transform="translate(237 126)" fill="#F5F5F5"/>',
                title,
                '</g></g><path fill-rule="evenodd" clip-rule="evenodd" d="M424 0L492.519 90H559L490.481 0H424Z" fill="white"/><defs><filter id="filter0_d_2018_2607" x="209" y="26" width="630" height="978" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feMorphology radius="4" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_2018_2607"/><feOffset/><feGaussianBlur stdDeviation="12"/><feColorMatrix type="matrix" values="0 0 0 0 0.129412 0 0 0 0 0.0941176 0 0 0 0 0.0784314 0 0 0 0.15 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2018_2607"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2018_2607" result="shape"/></filter><linearGradient id="paint0_linear_2018_2607" x1="277" y1="171.491" x2="328.625" y2="14.4391" gradientUnits="userSpaceOnUse"><stop stop-color="#603DEB"/><stop offset="1" stop-color="#27C1D6"/></linearGradient><clipPath id="clip0_2018_2607"><rect x="237" y="54" width="574" height="922" rx="24" fill="white"/></clipPath></defs></svg>'
            )
        );

        // create the data uri for the image itself
        string memory image = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(abi.encodePacked(svg)))
            )
        );

        // create the json that includes the image
        string memory json = string(
            abi.encodePacked('{"image":"', image, '"}')
        );
        // render the base64 encoded json metadata
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(abi.encodePacked(json)))
                )
            );
    }
}
