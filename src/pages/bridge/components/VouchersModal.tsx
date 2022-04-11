import React from 'react';
import { Dialog } from '@headlessui/react';
import { IoMdClose } from 'react-icons/io';

import Modal from 'components/Modal';
import { HiOutlineTicket } from 'react-icons/hi';
import Voucher from './Voucher';

export interface IVouchersModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const VouchersModal: React.FC<IVouchersModalProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className="relative rounded-3xl bg-white p-6 shadow-2xl">
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-white/60 opacity-50 blur-lg"></div>
        <div className="flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title
              as="h1"
              className="p-2 text-xl font-semibold text-black text-opacity-[0.54]"
            >
              Vouchers
            </Dialog.Title>
            <div className="hover ml-auto text-hyphen-purple-dark/80">
              <button onClick={onClose}>
                <IoMdClose className="h-6 w-auto" />
              </button>
            </div>
          </div>
          <div className="grid max-h-96 grid-cols-1 gap-2 overflow-auto">
            <Voucher />
            <Voucher />
            <Voucher />
            <Voucher />
            <Voucher />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VouchersModal;
