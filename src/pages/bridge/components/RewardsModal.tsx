import React from 'react';
import { Dialog } from '@headlessui/react';
import { IoMdClose } from 'react-icons/io';

import Modal from 'components/Modal';

export interface IRewardsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const RewardsModal: React.FC<IRewardsModalProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className="mb-14">
        <div className="relative rounded-3xl bg-white p-6 shadow-2xl">
          <div className="absolute -inset-2 -z-10 rounded-3xl bg-white/60 opacity-50 blur-lg"></div>
          <div className="flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title
                as="h1"
                className="p-2 text-xl font-semibold text-black text-opacity-[0.54]"
              >
                Rewards
              </Dialog.Title>
              <div className="hover ml-auto text-hyphen-purple-dark/80">
                <button onClick={onClose}>
                  <IoMdClose className="h-6 w-auto" />
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-hyphen-purple border-opacity-10 bg-hyphen-purple bg-opacity-[0.05] p-4 transition-colors hover:border-opacity-30">
              Hello from Rewards Modal!
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RewardsModal;
